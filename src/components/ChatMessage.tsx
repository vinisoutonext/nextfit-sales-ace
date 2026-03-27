import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`animate-message-in flex gap-3 px-4 py-4 ${isUser ? "" : "bg-chat-ai/40"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser ? "bg-primary" : "bg-muted border border-border"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {isUser ? "Você" : "Next Fit AI"}
        </p>
        <div className="prose prose-sm max-w-none text-foreground prose-p:leading-relaxed prose-p:my-1 prose-headings:text-foreground prose-strong:text-foreground prose-ul:my-1 prose-li:my-0">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="animate-message-in flex gap-3 px-4 py-4 bg-chat-ai/40">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
        <Bot className="h-4 w-4 text-foreground" />
      </div>
      <div className="flex items-center gap-1 pt-2">
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}
