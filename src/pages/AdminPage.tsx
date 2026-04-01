import { useState, useEffect, useMemo } from "react";
import { Download, AlertTriangle, Search, Lock, ArrowLeft, TrendingUp, MessageSquare, BarChart3, ThumbsUp, ChevronLeft, ChevronRight, Users, User } from "lucide-react";
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

  // Reset page on filter change
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

  // Users who have made questions
  const activeUsers = useMemo(() => {
    const userIds = new Set(logs.filter((l) => l.user_id).map((l) => l.user_id!));
    return profiles.filter((p) => userIds.has(p.id));
  }, [logs, profiles]);

  // Per-user metrics
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

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
              {passwordError && <p className="text-xs text-destructive">Senha incorreta</p>}
              <button
                onClick={handleAuth}
                className="w-full py-3 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
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

  const METRIC_CARDS = [
    { label: "Total de perguntas", value: metrics.total, icon: MessageSquare, color: "text-primary" },
    { label: "Perguntas hoje", value: metrics.today, icon: TrendingUp, color: "text-emerald-600" },
    { label: "Tópicos únicos", value: metrics.topics, icon: BarChart3, color: "text-blue-600" },
    { label: "% bem avaliadas", value: `${metrics.positiveRate}%`, icon: ThumbsUp, color: "text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">Inteligência Comercial</h1>
              <p className="text-xs text-muted-foreground font-light">Análise de perguntas e treinamentos</p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Filters row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 flex-wrap">
            {([["today", "Hoje"], ["week", "Esta semana"], ["month", "Este mês"], ["all", "Tudo"]] as [Period, string][]).map(
              ([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPeriod(val)}
                  className={`px-4 py-2 text-xs rounded-xl font-medium transition-all ${
                    period === val
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-muted-foreground border border-border hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>

          {/* User filter */}
          <div className="flex items-center gap-2 ml-auto">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-normal min-w-[160px]"
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
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{userMetrics.profile?.nome || "Usuário"}</p>
              <p className="text-xs text-muted-foreground">{userMetrics.profile?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-foreground">{userMetrics.total}</p>
              <p className="text-[10px] text-muted-foreground">perguntas • top: {userMetrics.topCategory}</p>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {METRIC_CARDS.map((m) => (
            <div key={m.label} className="rounded-2xl border border-border bg-card p-5 group hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-light">{m.label}</p>
                <m.icon className={`h-4 w-4 ${m.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category distribution */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-sm font-bold text-foreground mb-5">Distribuição por categoria</h3>
            <div className="space-y-4">
              {categoryDistribution.map((cat) => {
                const tag = CATEGORY_TAGS[cat.name] || CATEGORY_TAGS["Outro"];
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: tag.bg, color: tag.text }}
                      >
                        {cat.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{cat.count} ({cat.pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-accent overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${cat.width}%` }}
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

          {/* Top 10 questions */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-sm font-bold text-foreground mb-5">Top 10 perguntas</h3>
            <div className="space-y-3">
              {topQuestions.map((q, i) => {
                const tag = CATEGORY_TAGS[q.cat] || CATEGORY_TAGS["Outro"];
                const needsReview = q.negCount >= 3;
                return (
                  <div key={i} className="group">
                    <div className="flex items-start gap-2.5 mb-1">
                      <span className="text-xs text-muted-foreground w-5 text-right shrink-0 pt-0.5 font-medium">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-sm text-foreground truncate capitalize leading-tight">{q.question}</p>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0 font-medium"
                            style={{ backgroundColor: tag.bg, color: tag.text }}
                          >
                            {q.cat}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-accent overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${Math.round((q.count / maxQ) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground shrink-0 w-8 text-right">{q.count}x</span>
                        </div>
                        {needsReview && (
                          <p className="flex items-center gap-1 text-[10px] text-destructive mt-1 font-medium">
                            <AlertTriangle className="h-3 w-3" /> Revisar no playbook
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {topQuestions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma pergunta registrada</p>
              )}
            </div>
          </div>
        </div>

        {/* History table with pagination */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="font-display text-sm font-bold text-foreground">Histórico de perguntas</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar perguntas..."
                className="pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Pergunta</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Resposta</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Usuário</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Categoria</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground">Avaliação</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((l) => {
                  const tag = CATEGORY_TAGS[l._cat] || CATEGORY_TAGS["Outro"];
                  const userName = l.user_id ? (profileMap[l.user_id]?.nome || "—") : "—";
                  return (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-3 max-w-[200px]">
                        <p className="text-foreground truncate text-xs">{l.pergunta}</p>
                      </td>
                      <td className="py-3 px-3 max-w-[250px] hidden md:table-cell">
                        <p className="text-muted-foreground truncate text-xs">{l.resposta}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-foreground font-medium">{userName}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap"
                          style={{ backgroundColor: tag.bg, color: tag.text }}
                        >
                          {l._cat}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {l.avaliacao === "positivo" ? (
                          <span className="text-emerald-600">👍</span>
                        ) : l.avaliacao === "negativo" ? (
                          <span className="text-destructive">👎</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                        {new Date(l.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum resultado encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent text-foreground font-medium"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent text-foreground font-medium"
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
