import { useState, useEffect, useMemo } from "react";
import { Download, AlertTriangle, Search, Lock, ArrowLeft, TrendingUp, MessageSquare, BarChart3, ThumbsUp, ChevronLeft, ChevronRight, Users, User, Trophy, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface LogEntry {
  id: string;
  pergunta: string;
  resposta: string;
  avaliacao: string | null;
  categoria: string | null;
  created_at: string;
  user_id: string | null;
}

interface Profile {
  id: string;
  nome: string;
  email: string;
}

type Period = "today" | "week" | "month" | "all";

const ADMIN_PASSWORD = "123456";
const SESSION_KEY = "nf_admin_auth";
const PAGE_SIZE = 10;

const CATEGORY_TAGS: Record<string, { bg: string; text: string }> = {
  "Objeção": { bg: "hsl(40 96% 89%)", text: "hsl(26 90% 37%)" },
  "Produto": { bg: "hsl(263 70% 95%)", text: "hsl(263 70% 36%)" },
  "Concorrência": { bg: "hsl(0 86% 93%)", text: "hsl(0 72% 35%)" },
  "Processo": { bg: "hsl(152 76% 91%)", text: "hsl(164 86% 20%)" },
  "Outro": { bg: "hsl(220 14% 96%)", text: "hsl(220 9% 31%)" },
};

function classifyQuestion(q: string): string {
  const lower = q.toLowerCase();
  if (/obje[çc]|preço|caro|desconto|n[ãa]o tenho|n[ãa]o preciso|já tenho/.test(lower)) return "Objeção";
  if (/plano|funcionalidade|recurso|sistema|app|modulo|check-in|treino|financeiro/.test(lower)) return "Produto";
  if (/concorr|tecnofit|evo|glofox|compara/.test(lower)) return "Concorrência";
  if (/processo|pitch|follow|agend|sdr|closer|rapport|spin|call/.test(lower)) return "Processo";
  return "Outro";
}

// Detail modal component
function DetailModal({ log, userName, onClose }: { log: LogEntry & { _cat: string }; userName: string; onClose: () => void }) {
  const tag = CATEGORY_TAGS[log._cat] || CATEGORY_TAGS["Outro"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-page-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: tag.bg, color: tag.text }}>
              {log._cat}
            </span>
            <span className="text-xs text-muted-foreground">{userName}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(log.created_at).toLocaleString("pt-BR")}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">Pergunta</p>
            <p className="text-sm text-foreground leading-relaxed">{log.pergunta}</p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Resposta da IA</p>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{log.resposta}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [detailLog, setDetailLog] = useState<(LogEntry & { _cat: string }) | null>(null);

  useEffect(() => {
    if (authenticated) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setLoading(true);
      Promise.all([
        supabase.from("logs").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("profiles").select("*"),
      ]).then(([logsRes, profilesRes]) => {
        setLogs((logsRes.data as LogEntry[]) || []);
        setProfiles((profilesRes.data as Profile[]) || []);
        setLoading(false);
      });
    }
  }, [authenticated]);

  const handleAuth = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const profileMap = useMemo(() => {
    const m: Record<string, Profile> = {};
    profiles.forEach((p) => { m[p.id] = p; });
    return m;
  }, [profiles]);

  const filtered = useMemo(() => {
    const now = new Date();
    return logs.filter((l) => {
      const d = new Date(l.created_at);
      if (period === "today") return d.toDateString() === now.toDateString();
      if (period === "week") return d > new Date(now.getTime() - 7 * 86400000);
      if (period === "month") return d > new Date(now.getTime() - 30 * 86400000);
      return true;
    }).filter((l) => {
      if (selectedUser === "all") return true;
      return l.user_id === selectedUser;
    });
  }, [logs, period, selectedUser]);

  const categorized = useMemo(() => {
    return filtered.map((l) => ({
      ...l,
      _cat: l.categoria || classifyQuestion(l.pergunta),
    }));
  }, [filtered]);

  const searched = useMemo(() => {
    if (!search.trim()) return categorized;
    const q = search.toLowerCase();
    return categorized.filter(
      (l) => l.pergunta.toLowerCase().includes(q) || l.resposta.toLowerCase().includes(q)
    );
  }, [categorized, search]);

  useEffect(() => { setPage(0); }, [search, period, selectedUser]);

  const totalPages = Math.ceil(searched.length / PAGE_SIZE);
  const paginatedLogs = searched.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const metrics = useMemo(() => {
    const cats = new Set(categorized.map((l) => l._cat));
    const today = categorized.filter(
      (l) => new Date(l.created_at).toDateString() === new Date().toDateString()
    ).length;
    const withFeedback = categorized.filter((l) => l.avaliacao);
    const positive = withFeedback.filter((l) => l.avaliacao === "positivo").length;
    const pct = withFeedback.length > 0 ? Math.round((positive / withFeedback.length) * 100) : 0;
    const uniqueUsers = new Set(categorized.filter((l) => l.user_id).map((l) => l.user_id)).size;
    return { total: categorized.length, topics: cats.size, today, positiveRate: pct, uniqueUsers };
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

  const activeUsers = useMemo(() => {
    const userIds = new Set(logs.filter((l) => l.user_id).map((l) => l.user_id!));
    return profiles.filter((p) => userIds.has(p.id));
  }, [logs, profiles]);

  // Ranking: top 5 users by question count
  const userRanking = useMemo(() => {
    const counts: Record<string, { count: number; cats: Record<string, number> }> = {};
    categorized.forEach((l) => {
      if (!l.user_id) return;
      if (!counts[l.user_id]) counts[l.user_id] = { count: 0, cats: {} };
      counts[l.user_id].count++;
      counts[l.user_id].cats[l._cat] = (counts[l.user_id].cats[l._cat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([userId, data]) => {
        const topCat = Object.entries(data.cats).sort(([, a], [, b]) => b - a)[0];
        return {
          userId,
          name: profileMap[userId]?.nome || "—",
          email: profileMap[userId]?.email || "",
          count: data.count,
          topCategory: topCat?.[0] || "—",
        };
      });
  }, [categorized, profileMap]);

  const userMetrics = useMemo(() => {
    if (selectedUser === "all") return null;
    const userLogs = categorized.filter((l) => l.user_id === selectedUser);
    const cats: Record<string, number> = {};
    userLogs.forEach((l) => { cats[l._cat] = (cats[l._cat] || 0) + 1; });
    const topCat = Object.entries(cats).sort(([, a], [, b]) => b - a)[0];
    return {
      total: userLogs.length,
      topCategory: topCat ? topCat[0] : "—",
      profile: profileMap[selectedUser],
    };
  }, [selectedUser, categorized, profileMap]);

  const maxQ = topQuestions[0]?.count || 1;

  const exportCSV = () => {
    const header = "Pergunta,Resposta,Categoria,Avaliação,Usuário,Data\n";
    const rows = categorized.map((l) => {
      const userName = l.user_id ? (profileMap[l.user_id]?.nome || "—") : "—";
      return `"${l.pergunta.replace(/"/g, '""')}","${l.resposta.replace(/"/g, '""')}","${l._cat}","${l.avaliacao || ""}","${userName}","${new Date(l.created_at).toLocaleString("pt-BR")}"`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nextfit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // ─── Login Screen ──────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-page-in">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-display text-xl font-bold text-foreground">Acesso Restrito</h1>
              <p className="text-sm text-muted-foreground font-light mt-1">Painel de Inteligência Comercial</p>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                className={`w-full px-4 py-3 text-sm rounded-xl border ${passwordError ? "border-destructive ring-2 ring-destructive/20" : "border-border"} bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-normal`}
                placeholder="Digite a senha"
                autoFocus
              />
              {passwordError && <p className="text-xs text-destructive font-medium">Senha incorreta</p>}
              <button
                onClick={handleAuth}
                className="w-full py-3 text-sm rounded-xl text-primary-foreground font-medium hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "var(--gradient-primary)" }}
              >
                Acessar Dashboard
              </button>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mx-auto mt-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao chat
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // ─── Dashboard ────────────────────────────────────────────────
  const METRIC_CARDS = [
    { label: "Total de perguntas", value: metrics.total, icon: MessageSquare, iconBg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Perguntas hoje", value: metrics.today, icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "Usuários ativos", value: metrics.uniqueUsers, icon: Users, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "% bem avaliadas", value: `${metrics.positiveRate}%`, icon: ThumbsUp, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-background animate-page-in">
      {detailLog && (
        <DetailModal
          log={detailLog}
          userName={detailLog.user_id ? (profileMap[detailLog.user_id]?.nome || "—") : "—"}
          onClose={() => setDetailLog(null)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-extrabold text-foreground">Inteligência Comercial</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
                  {period === "today" ? "Hoje" : period === "week" ? "7 dias" : period === "month" ? "30 dias" : "Total"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-light mt-0.5">
                Análise de perguntas e treinamentos · {metrics.total} registros
              </p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-5 py-2.5 text-xs rounded-xl text-primary-foreground font-medium hover-lift"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 flex-wrap">
            {([["today", "Hoje"], ["week", "Esta semana"], ["month", "Este mês"], ["all", "Tudo"]] as [Period, string][]).map(
              ([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPeriod(val)}
                  className={`px-4 py-2.5 text-xs rounded-xl font-medium transition-all ${
                    period === val
                      ? "text-primary-foreground shadow-sm"
                      : "bg-card text-muted-foreground border border-border hover:border-primary/40 hover:text-foreground"
                  }`}
                  style={period === val ? { background: "var(--gradient-primary)" } : {}}
                >
                  {label}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-2.5 text-xs rounded-xl border border-border bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-medium min-w-[180px] cursor-pointer"
            >
              <option value="all">Todos os usuários</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* User-specific card */}
        {userMetrics && (
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 flex items-center gap-4 hover-lift">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {userMetrics.profile?.nome?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{userMetrics.profile?.nome || "Usuário"}</p>
              <p className="text-xs text-muted-foreground">{userMetrics.profile?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-extrabold text-foreground">{userMetrics.total}</p>
              <p className="text-[10px] text-muted-foreground">perguntas · top: {userMetrics.topCategory}</p>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRIC_CARDS.map((m, i) => (
            <div 
              key={m.label} 
              className="rounded-2xl border border-border bg-card p-5 hover-lift animate-stagger-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{m.label}</p>
                <div className={`h-8 w-8 rounded-xl ${m.iconBg} flex items-center justify-center`}>
                  <m.icon className={`h-4 w-4 ${m.iconColor}`} />
                </div>
              </div>
              <p className="text-3xl font-display font-extrabold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Ranking + Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Ranking */}
          <div className="rounded-2xl border border-border bg-card p-6 hover-lift">
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="font-display text-sm font-bold text-foreground">Ranking de Usuários</h3>
            </div>
            <div className="space-y-3">
              {userRanking.map((u, i) => (
                <div key={u.userId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(u.userId)}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-accent text-muted-foreground"
                  }`}>
                    <span className="text-xs font-bold">{i + 1}º</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">Top: {u.topCategory}</p>
                  </div>
                  <span className="text-sm font-display font-bold text-foreground">{u.count}</span>
                </div>
              ))}
              {userRanking.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum dado disponível</p>
              )}
            </div>
          </div>

          {/* Category distribution */}
          <div className="rounded-2xl border border-border bg-card p-6 hover-lift">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground">Distribuição por Categoria</h3>
            </div>
            <div className="space-y-4">
              {categoryDistribution.map((cat) => {
                const tag = CATEGORY_TAGS[cat.name] || CATEGORY_TAGS["Outro"];
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: tag.bg, color: tag.text }}
                      >
                        {cat.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{cat.count} ({cat.pct}%)</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-accent overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${cat.width}%`, background: "var(--gradient-primary)" }}
                      />
                    </div>
                  </div>
                );
              })}
              {categoryDistribution.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum dado disponível</p>
              )}
            </div>
          </div>
        </div>

        {/* Top 10 questions */}
        <div className="rounded-2xl border border-border bg-card p-6 hover-lift">
          <h3 className="font-display text-sm font-bold text-foreground mb-5">Top 10 Perguntas Mais Frequentes</h3>
          <div className="space-y-3">
            {topQuestions.map((q, i) => {
              const tag = CATEGORY_TAGS[q.cat] || CATEGORY_TAGS["Outro"];
              const needsReview = q.negCount >= 3;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors">
                  <span className="text-xs text-muted-foreground w-6 text-right shrink-0 pt-1 font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-foreground capitalize leading-snug line-clamp-2">{q.question}</p>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-md shrink-0 font-bold"
                        style={{ backgroundColor: tag.bg, color: tag.text }}
                      >
                        {q.cat}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${Math.round((q.count / maxQ) * 100)}%`, background: "var(--gradient-primary)" }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0">{q.count}×</span>
                    </div>
                    {needsReview && (
                      <p className="flex items-center gap-1 text-[10px] text-destructive mt-1.5 font-bold">
                        <AlertTriangle className="h-3 w-3" /> Revisar no playbook
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {topQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma pergunta registrada</p>
            )}
          </div>
        </div>

        {/* History table */}
        <div className="rounded-2xl border border-border bg-card p-6 hover-lift">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="font-display text-sm font-bold text-foreground">Histórico de Perguntas</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar perguntas..."
                className="pl-9 pr-4 py-2.5 text-xs rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 w-64 font-medium"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pergunta</th>
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Resposta</th>
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Usuário</th>
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Categoria</th>
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nota</th>
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Data</th>
                  <th className="py-3 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((l) => {
                  const tag = CATEGORY_TAGS[l._cat] || CATEGORY_TAGS["Outro"];
                  const userName = l.user_id ? (profileMap[l.user_id]?.nome || "—") : "—";
                  return (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors group cursor-pointer" onClick={() => setDetailLog(l)}>
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <p className="text-foreground truncate text-xs font-medium">{l.pergunta}</p>
                      </td>
                      <td className="py-3.5 px-3 max-w-[250px] hidden md:table-cell">
                        <p className="text-muted-foreground truncate text-xs">{l.resposta}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-xs text-foreground font-medium">{userName}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap"
                          style={{ backgroundColor: tag.bg, color: tag.text }}
                        >
                          {l._cat}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs">
                        {l.avaliacao === "positivo" ? (
                          <span className="text-emerald-600">👍</span>
                        ) : l.avaliacao === "negativo" ? (
                          <span className="text-destructive">👎</span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                        {new Date(l.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3.5 px-2">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </td>
                    </tr>
                  );
                })}
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum resultado encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl border border-border hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent text-foreground font-medium"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-medium ${
                        page === pageNum ? "text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                      }`}
                      style={page === pageNum ? { background: "var(--gradient-primary)" } : {}}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl border border-border hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent text-foreground font-medium"
              >
                Próximo <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
