import { MessageSquare } from "lucide-react";
import { useRef, useCallback, useState } from "react";
import nextfitLogo from "@/assets/nextfit-logo.png";
import { AdminDashboardModal } from "@/components/AdminDashboardModal";

const CLICKS_NEEDED = 11;
const RESET_MS = 3000;

export function AppSidebar() {
  const clickCount = useRef(0);
  const lastClick = useRef(0);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClick.current > RESET_MS) {
      clickCount.current = 0;
    }
    lastClick.current = now;
    clickCount.current += 1;
    if (clickCount.current >= CLICKS_NEEDED) {
      clickCount.current = 0;
      setShowAdmin(true);
    }
  }, []);

  return (
    <>
      <aside className="flex flex-col w-[210px] shrink-0 h-screen bg-primary">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <img
            src={nextfitLogo}
            alt="Next Fit"
            width={32}
            height={32}
            className="rounded-lg object-contain cursor-pointer select-none"
            onClick={handleLogoClick}
            draggable={false}
          />
          <div>
            <h1 className="font-display text-sm font-bold text-white tracking-tight">Next Fit</h1>
            <p className="text-[11px] text-white/55 font-light">Assistente de Vendas</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <button
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/15"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span>Chat de Vendas</span>
          </button>
        </nav>
      </aside>

      <AdminDashboardModal open={showAdmin} onClose={() => setShowAdmin(false)} />
    </>
  );
}
