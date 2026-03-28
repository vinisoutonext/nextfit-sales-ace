import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
