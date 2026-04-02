import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import nextfitLogo from "@/assets/nextfit-logo.png";
import { Sparkles, Zap, Shield, TrendingUp } from "lucide-react";

const VALUE_PROPS = [
  { icon: Zap, text: "Respostas instantâneas sobre produto e objeções" },
  { icon: Shield, text: "Base de conhecimento oficial da Next Fit" },
  { icon: TrendingUp, text: "Feche mais vendas com inteligência artificial" },
];

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
      const msg = err.message?.includes("Invalid login")
        ? "E-mail ou senha incorretos"
        : err.message || "Erro ao autenticar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex animate-page-in">
      {/* Left branding panel - hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-center items-center w-[45%] relative overflow-hidden"
        style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-sm px-8">
          <div className="flex items-center gap-3 mb-8">
            <img src={nextfitLogo} alt="Next Fit" width={48} height={48} className="rounded-2xl shadow-lg ring-2 ring-white/10" />
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Mentor</h1>
              <p className="text-white/50 text-sm font-light">Next Fit Sales AI</p>
            </div>
          </div>

          <h2 className="font-display text-3xl font-extrabold text-white leading-tight mb-4">
            Seu assistente<br />de vendas inteligente
          </h2>
          <p className="text-white/60 text-sm font-light leading-relaxed mb-8">
            Toda a base de conhecimento da Next Fit ao alcance de uma pergunta.
          </p>

          <div className="space-y-4">
            {VALUE_PROPS.map((v, i) => (
              <div key={i} className="flex items-center gap-3 animate-stagger-in" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <v.icon className="h-4 w-4 text-white/80" />
                </div>
                <p className="text-white/80 text-sm font-light">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="flex flex-col items-center mb-8 lg:hidden animate-stagger-in">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-2xl bg-primary/5 scale-[2]" />
              <img src={nextfitLogo} alt="Next Fit" width={48} height={48} className="rounded-2xl relative shadow-lg" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-primary/60">
                Mentor de Vendas
              </span>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-stagger-in" style={{ animationDelay: "100ms" }}>
            <div className="mb-6">
              <h1 className="font-display text-xl font-bold text-foreground">
                {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
              </h1>
              <p className="text-sm text-muted-foreground font-light mt-1">
                {isLogin ? "Acesse o Mentor Next Fit" : "Comece a usar o Mentor Next Fit"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-normal"
                    placeholder="Seu nome completo"
                  />
                </div>
              )}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-normal"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-normal"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm rounded-xl text-primary-foreground font-medium disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] mt-2"
                style={{ background: "var(--gradient-primary)" }}
              >
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
              </button>
            </form>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-xs text-muted-foreground hover:text-primary mt-5 text-center font-medium"
            >
              {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/30 mt-4 font-light">
            Powered by Next Fit
          </p>
        </div>
      </div>
    </div>
  );
}
