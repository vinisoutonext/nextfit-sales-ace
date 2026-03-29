import { MessageSquare, X } from "lucide-react";
import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import nextfitLogo from "@/assets/nextfit-logo.png";

const CLICKS_NEEDED = 11;
const RESET_MS = 3000;

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const navigate = useNavigate();
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
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="sidebar-overlay fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:relative z-50 flex flex-col w-[220px] shrink-0 h-screen bg-primary
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
              width={34}
              height={34}
              className="rounded-lg object-contain cursor-pointer select-none"
              onClick={handleLogoClick}
              draggable={false}
            />
            <div>
              <h1 className="font-display text-[15px] font-bold text-white tracking-tight leading-tight">
                Mentor
              </h1>
              <p className="text-[11px] text-white/50 font-light leading-tight">
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

        {/* Divider */}
        <div className="mx-4 h-px bg-white/10" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <button className="flex items-center gap-3 w-full rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-white bg-white/[0.14] hover:bg-white/[0.18]">
            <MessageSquare className="h-4 w-4 shrink-0 opacity-80" />
            <span>Chat de Vendas</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="px-5 pb-5">
          <div className="h-px bg-white/10 mb-3" />
          <p className="text-[10px] text-white/30 font-light text-center">
            Powered by Next Fit
          </p>
        </div>
      </aside>

    </>
  );
}
