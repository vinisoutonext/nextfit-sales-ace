import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Clock, TrendingUp } from "lucide-react";

interface LogEntry {
  id: string;
  pergunta: string;
  resposta: string;
  created_at: string;
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) setLogs(data as LogEntry[]);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground mb-6">Histórico de perguntas e respostas da IA</p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total de Perguntas", value: logs.length, icon: MessageSquare },
            { label: "Hoje", value: logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length, icon: Clock },
            { label: "Últimos 7 dias", value: logs.filter((l) => new Date(l.created_at) > new Date(Date.now() - 7 * 86400000)).length, icon: TrendingUp },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{loading ? "..." : stat.value}</p>
            </div>
          ))}
        </div>

        {/* Logs table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Histórico Recente</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma pergunta registrada ainda.</div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-sm font-medium text-foreground">{log.pergunta}</p>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{log.resposta}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
