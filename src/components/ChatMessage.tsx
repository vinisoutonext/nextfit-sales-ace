import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import nextfitLogo from "@/assets/nextfit-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  logId?: string;
}

export function ChatMessage({ role, content, logId }: ChatMessageProps) {
  const isUser = role === "user";
  const [feedback, setFeedback] = useState<"positivo" | "negativo" | null>(null);

  const handleFeedback = async (value: "positivo" | "negativo") => {
    if (feedback || !logId) return;
    setFeedback(value);
    await supabase.from("logs").update({ avaliacao: value }).eq("id", logId);
  };

  if (isUser) {
    return (
      <div className="animate-message-in flex justify-end px-4 py-2.5">
        <div
          className="max-w-[80%] px-4 py-3 text-sm text-primary-foreground bg-primary"
          style={{ borderRadius: "16px 4px 16px 16px" }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-message-in flex gap-2.5 px-4 py-2.5 group">
      <img
        src={nextfitLogo}
        alt="Next Fit AI"
        width={28}
        height={28}
        className="rounded-md object-contain shrink-0 mt-0.5"
      />
      <div className="flex flex-col min-w-0 max-w-[80%]">
        <div
          className="px-4 py-3 bg-card border border-border text-sm text-foreground"
          style={{ borderRadius: "4px 16px 16px 16px" }}
        >
          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:text-foreground prose-headings:font-display prose-strong:text-primary prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
        {/* Feedback buttons */}
        {logId && (
          <div className={`flex gap-1 mt-1 ml-1 ${feedback ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            <button
              onClick={() => handleFeedback("positivo")}
              disabled={!!feedback}
              className={`p-1 rounded transition-colors ${
                feedback === "positivo" ? "text-primary" : "text-muted hover:text-foreground"
              } disabled:cursor-default`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleFeedback("negativo")}
              disabled={!!feedback}
              className={`p-1 rounded transition-colors ${
                feedback === "negativo" ? "text-primary" : "text-muted hover:text-foreground"
              } disabled:cursor-default`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="animate-message-in flex gap-2.5 px-4 py-2.5">
      <img
        src={nextfitLogo}
        alt="Next Fit AI"
        width={28}
        height={28}
        className="rounded-md object-contain shrink-0 mt-0.5"
      />
      <div
        className="flex items-center gap-1.5 px-4 py-3 bg-card border border-border"
        style={{ borderRadius: "4px 16px 16px 16px" }}
      >
        <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
        <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
      </div>
    </div>
  );
}
