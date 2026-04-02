import { MessageSquare, X, LogOut, Plus } from "lucide-react";
import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import nextfitLogo from "@/assets/nextfit-logo.png";

const CLICKS_NEEDED = 11;
const RESET_MS = 3000;

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  onNewChat?: () => void;
}

export function AppSidebar({ open, onClose, onNewChat }: AppSidebarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const clickCount = useRef(0);
  const lastClick = useRef(0);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClick.current > RESET_MS) {
      clickCount.current = 0;
    }
    lastClick.current = now;
    clickCount.current += 1;
    if (clickCount.current >= CLICKS_NEEDED) {
      clickCount.current = 0;
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const userInitials = user?.user_metadata?.nome
    ? user.user_metadata.nome.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "?";

  const userName = user?.user_metadata?.nome || user?.email?.split("@")[0] || "Usuário";
  const userEmail = user?.email || "";

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:relative z-50 flex flex-col w-[240px] shrink-0 h-screen
          bg-gradient-to-b from-[hsl(278,51%,36%)] to-[hsl(278,51%,30%)]
          transform transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={nextfitLogo}
              alt="Next Fit"
              width={36}
              height={36}
              className="rounded-xl object-contain cursor-pointer select-none ring-2 ring-white/10"
              onClick={handleLogoClick}
              draggable={false}
            />
            <div>
              <h1 className="font-display text-[15px] font-bold text-white tracking-tight leading-tight">
                Mentor
              </h1>
              <p className="text-[11px] text-white/40 font-light leading-tight">
                Next Fit Sales AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 mb-1">
          <button
            onClick={() => { onNewChat?.(); onClose(); }}
            className="flex items-center gap-2.5 w-full rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-white/80 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 group"
          >
            <Plus className="h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100" />
            <span>Nova conversa</span>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/8 my-2" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-2">
          <button className="flex items-center gap-3 w-full rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-white bg-white/[0.12] hover:bg-white/[0.18]">
            <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
            <span>Chat de Vendas</span>
          </button>
        </nav>

        {/* Footer - User info */}
        <div className="px-3 pb-4">
          <div className="mx-1 h-px bg-white/8 mb-3" />
          
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 group">
            <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-white/90">{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/90 truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-white/35 truncate leading-tight">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
