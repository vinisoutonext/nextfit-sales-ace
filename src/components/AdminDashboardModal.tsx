import { useState, useEffect, useMemo } from "react";
import { X, Download, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LogEntry {
  id: string;
  pergunta: string;
  resposta: string;
  avaliacao: string | null;
  categoria: string | null;
  created_at: string;
}

type Period = "today" | "week" | "month" | "all";

const ADMIN_PASSWORD = "nextfit2024";

const CATEGORY_TAGS: Record<string, { bg: string; text: string }> = {
  "Objeção": { bg: "#FEF3C7", text: "#92400E" },
  "Produto": { bg: "#EDE9FE", text: "#5B21B6" },
  "Concorrência": { bg: "#FEE2E2", text: "#991B1B" },
  "Processo": { bg: "#D1FAE5", text: "#065F46" },
  "Outro": { bg: "#F3F4F6", text: "#374151" },
};

function classifyQuestion(q: string): string {
  const lower = q.toLowerCase();
  if (/obje[çc]|preço|caro|desconto|n[ãa]o tenho|n[ãa]o preciso|já tenho/.test(lower)) return "Objeção";
  if (/plano|funcionalidade|recurso|sistema|app|modulo|check-in|treino|financeiro/.test(lower)) return "Produto";
  if (/concorr|tecnofit|evo|glofox|compara/.test(lower)) return "Concorrência";
  if (/processo|pitch|follow|agend|sdr|closer|rapport|spin|call/.test(lower)) return "Processo";
  return "Outro";
}

export function AdminDashboardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    if (open && authenticated) {
      setLoading(true);
      supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000)
        .then(({ data }) => {
          setLogs((data as LogEntry[]) || []);
          setLoading(false);
        });
    }
  }, [open, authenticated]);

  useEffect(() => {
    if (!open) {
      setAuthenticated(false);
      setPassword("");
      setPasswordError(false);
    }
  }, [open]);

  const handleAuth = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    return logs.filter((l) => {
      const d = new Date(l.created_at);
      if (period === "today") return d.toDateString() === now.toDateString();
      if (period === "week") return d > new Date(now.getTime() - 7 * 86400000);
      if (period === "month") return d > new Date(now.getTime() - 30 * 86400000);
      return true;
    });
  }, [logs, period]);

  const categorized = useMemo(() => {
    return filtered.map((l) => ({
      ...l,
      _cat: l.categoria || classifyQuestion(l.pergunta),
    }));
  }, [filtered]);

  const metrics = useMemo(() => {
    const cats = new Set(categorized.map((l) => l._cat));
    const today = categorized.filter(
      (l) => new Date(l.created_at).toDateString() === new Date().toDateString()
    ).length;
    const withFeedback = categorized.filter((l) => l.avaliacao);
    const positive = withFeedback.filter((l) => l.avaliacao === "positivo").length;
    const pct = withFeedback.length > 0 ? Math.round((positive / withFeedback.length) * 100) : 0;
    return { total: categorized.length, topics: cats.size, today, positiveRate: pct };
  }, [categorized]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    categorized.forEach((l) => { counts[l._cat] = (counts[l._cat] || 0) + 1; });
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / categorized.length) * 100),
        width: Math.round((count / max) * 100),
      }));
  }, [categorized]);

  const topQuestions = useMemo(() => {
    const freq: Record<string, { count: number; cat: string; negCount: number }> = {};
    categorized.forEach((l) => {
      const q = l.pergunta.toLowerCase().trim();
      if (!freq[q]) freq[q] = { count: 0, cat: l._cat, negCount: 0 };
      freq[q].count++;
      if (l.avaliacao === "negativo") freq[q].negCount++;
    });
    return Object.entries(freq)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([q, d]) => ({ question: q, ...d }));
  }, [categorized]);

  const maxQ = topQuestions[0]?.count || 1;

  const exportCSV = () => {
    const header = "Pergunta,Resposta,Categoria,Avaliação,Data\n";
    const rows = categorized.map((l) =>
      `"${l.pergunta.replace(/"/g, '""')}","${l.resposta.replace(/"/g, '""')}","${l._cat}","${l.avaliacao || ""}","${new Date(l.created_at).toLocaleString("pt-BR")}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nextfit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Dashboard Admin</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!authenticated ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <p className="text-sm text-muted mb-4 font-light">Digite a senha para acessar o dashboard</p>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              className={`w-64 px-4 py-2.5 text-sm rounded-xl border ${passwordError ? "border-destructive" : "border-border"} bg-background outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(107,45,139,0.12)]`}
              placeholder="Senha"
              autoFocus
            />
            {passwordError && <p className="text-xs text-destructive mt-2">Senha incorreta</p>}
            <button
              onClick={handleAuth}
              className="mt-4 px-6 py-2 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover font-medium"
            >
              Entrar
            </button>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-muted text-sm">Carregando...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Period filter + Export */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                {([["today", "Hoje"], ["week", "Esta semana"], ["month", "Este mês"], ["all", "Tudo"]] as [Period, string][]).map(
                  ([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setPeriod(val)}
                      className={`px-4 py-1.5 text-xs rounded-full font-medium ${
                        period === val ? "bg-primary text-primary-foreground" : "bg-chip text-chip-text"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-full bg-chip text-chip-text hover:border-primary border border-chip-border font-medium"
              >
                <Download className="h-3.5 w-3.5" /> Exportar CSV
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total de perguntas", value: metrics.total },
                { label: "Tópicos únicos", value: metrics.topics },
                { label: "Perguntas hoje", value: metrics.today },
                { label: "% bem avaliadas", value: `${metrics.positiveRate}%` },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted mb-1 font-light">{m.label}</p>
                  <p className="text-xl font-display font-bold text-foreground">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Category distribution */}
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="font-display text-sm font-bold text-foreground mb-4">Distribuição por categoria</h3>
              <div className="space-y-3">
                {categoryDistribution.map((cat) => {
                  const tag = CATEGORY_TAGS[cat.name] || CATEGORY_TAGS["Outro"];
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-md w-24 text-center shrink-0"
                        style={{ backgroundColor: tag.bg, color: tag.text }}
                      >
                        {cat.name}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-chip overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${cat.width}%` }} />
                      </div>
                      <span className="text-xs text-muted w-12 text-right">{cat.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 10 questions */}
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="font-display text-sm font-bold text-foreground mb-4">Top 10 perguntas</h3>
              <div className="space-y-2.5">
                {topQuestions.map((q, i) => {
                  const tag = CATEGORY_TAGS[q.cat] || CATEGORY_TAGS["Outro"];
                  const needsReview = q.negCount >= 3;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-5 text-right shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-foreground truncate capitalize">{q.question}</p>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium"
                            style={{ backgroundColor: tag.bg, color: tag.text }}
                          >
                            {q.cat}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-chip overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.round((q.count / maxQ) * 100)}%` }}
                          />
                        </div>
                        {needsReview && (
                          <p className="flex items-center gap-1 text-[10px] text-destructive mt-1">
                            <AlertTriangle className="h-3 w-3" /> Revisar no playbook
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-foreground shrink-0">{q.count}x</span>
                    </div>
                  );
                })}
                {topQuestions.length === 0 && (
                  <p className="text-sm text-muted text-center py-4">Nenhuma pergunta registrada</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
