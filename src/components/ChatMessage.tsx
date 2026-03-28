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
      <div className="animate-message-in flex justify-end px-3 sm:px-4 py-1.5">
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 text-[14px] leading-relaxed text-primary-foreground bg-primary rounded-2xl rounded-br-md">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-message-in flex gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 group">
      <div className="shrink-0 mt-1">
        <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
          <img
            src={nextfitLogo}
            alt=""
            width={18}
            height={18}
            className="rounded object-contain"
          />
        </div>
      </div>
      <div className="flex flex-col min-w-0 max-w-[85%] sm:max-w-[78%]">
        <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-md text-[14px] leading-relaxed text-foreground">
          <div className="prose prose-sm max-w-none 
            prose-p:leading-relaxed prose-p:my-1.5 
            prose-headings:text-foreground prose-headings:font-display prose-headings:text-[15px] prose-headings:mt-3 prose-headings:mb-1.5
            prose-strong:text-primary prose-strong:font-medium
            prose-ul:my-1.5 prose-li:my-0.5 prose-li:leading-relaxed
            prose-ol:my-1.5
            prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:italic prose-blockquote:not-italic prose-blockquote:font-light
            prose-code:text-primary prose-code:bg-accent prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
        {logId && (
          <div className={`flex gap-0.5 mt-1 ml-2 ${feedback ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            <button
              onClick={() => handleFeedback("positivo")}
              disabled={!!feedback}
              className={`p-1 rounded-md ${
                feedback === "positivo" ? "text-primary bg-accent" : "text-muted-foreground/50 hover:text-foreground hover:bg-accent"
              } disabled:cursor-default`}
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleFeedback("negativo")}
              disabled={!!feedback}
              className={`p-1 rounded-md ${
                feedback === "negativo" ? "text-primary bg-accent" : "text-muted-foreground/50 hover:text-foreground hover:bg-accent"
              } disabled:cursor-default`}
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="animate-message-in flex gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5">
      <div className="shrink-0 mt-1">
        <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
          <img
            src={nextfitLogo}
            alt=""
            width={18}
            height={18}
            className="rounded object-contain"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-md">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
    </div>
  );
}
