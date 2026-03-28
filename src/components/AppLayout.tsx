import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import nextfitLogo from "@/assets/nextfit-logo.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex w-full overflow-hidden">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src={nextfitLogo} alt="" width={24} height={24} className="rounded-md" />
          <span className="font-display text-sm font-bold text-foreground">Mentor Next Fit</span>
        </div>

        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
