import { AppLayout } from "@/components/AppLayout";
import ChatPage from "@/pages/ChatPage";

const Index = () => (
  <AppLayout onNewChat={() => (window as any).__resetChat?.()}>
    <ChatPage />
  </AppLayout>
);

export default Index;
