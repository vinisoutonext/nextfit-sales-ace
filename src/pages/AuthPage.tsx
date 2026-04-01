import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import nextfitLogo from "@/assets/nextfit-logo.png";
import { Sparkles } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        if (!nome.trim()) {
          toast.error("Digite seu nome");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome: nome.trim() } },
        });
        if (error) throw error;
        toast.success("Conta criada! Entrando...");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-2xl bg-primary/5 scale-150" />
              <img src={nextfitLogo} alt="Next Fit" width={48} height={48} className="rounded-2xl relative" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[11px] font-medium tracking-widest uppercase text-primary/60">
                Mentor de Vendas
              </span>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {isLogin ? "Entrar" : "Criar conta"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-normal"
                placeholder="Seu nome"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-normal"
              placeholder="E-mail"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-normal"
              placeholder="Senha"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
            >
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-xs text-muted-foreground hover:text-foreground mt-4 text-center"
          >
            {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
