import { useState } from "react";
import { ThumbsUp, ThumbsDown, ChevronDown, Zap, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import nextfitLogo from "@/assets/nextfit-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  logId?: string;
}

function parseResponse(content: string) {
  // Try to split into quick and detail sections
  const quickMarkers = ["⚡ resposta rápida", "⚡ Resposta Rápida", "**⚡ Resposta Rápida**", "## ⚡ Resposta Rápida", "### ⚡ Resposta Rápida"];
  const detailMarkers = ["📖 detalhamento", "📖 Detalhamento", "**📖 Detalhamento**", "## 📖 Detalhamento", "### 📖 Detalhamento"];

  let quickIdx = -1;
  let detailIdx = -1;
  const lowerContent = content.toLowerCase();

  for (const m of quickMarkers) {
    const idx = lowerContent.indexOf(m.toLowerCase());
    if (idx !== -1) { quickIdx = idx; break; }
  }
  for (const m of detailMarkers) {
    const idx = lowerContent.indexOf(m.toLowerCase());
    if (idx !== -1) { detailIdx = idx; break; }
  }

  if (quickIdx !== -1 && detailIdx !== -1 && detailIdx > quickIdx) {
    // Find the end of the marker line for quick section
    const afterQuickMarker = content.indexOf("\n", quickIdx);
    const quickContent = content.slice(afterQuickMarker !== -1 ? afterQuickMarker + 1 : quickIdx, detailIdx).trim();
    
    const afterDetailMarker = content.indexOf("\n", detailIdx);
    const detailContent = content.slice(afterDetailMarker !== -1 ? afterDetailMarker + 1 : detailIdx).trim();

    return { quick: quickContent, detail: detailContent };
  }

  return null;
}

function MarkdownBlock({ content, className = "" }: { content: string; className?: string }) {
  return (
    <div className={`prose prose-sm max-w-none 
      prose-p:leading-relaxed prose-p:my-1 
      prose-headings:text-foreground prose-headings:font-display prose-headings:text-[15px] prose-headings:mt-2 prose-headings:mb-1
      prose-strong:text-primary prose-strong:font-medium
      prose-ul:my-1 prose-li:my-0 prose-li:leading-relaxed
      prose-ol:my-1
      prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:font-light
      prose-code:text-primary prose-code:bg-accent prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
      ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export function ChatMessage({ role, content, logId }: ChatMessageProps) {
  const isUser = role === "user";
  const [feedback, setFeedback] = useState<"positivo" | "negativo" | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const parsed = parseResponse(content);

  return (
    <div className="animate-message-in flex gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 group">
      <div className="shrink-0 mt-1">
        <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
          <img src={nextfitLogo} alt="" width={18} height={18} className="rounded object-contain" />
        </div>
      </div>
      <div className="flex flex-col min-w-0 max-w-[85%] sm:max-w-[78%] gap-2">
        {parsed ? (
          <>
            {/* Quick Response Card */}
            <div className="bg-card border border-border rounded-2xl rounded-tl-md overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-medium tracking-wider uppercase text-primary">
                  Resposta Rápida
                </span>
              </div>
              <div className="px-4 pb-3 text-[14px] leading-relaxed text-foreground">
                <MarkdownBlock content={parsed.quick} />
              </div>
            </div>

            {/* Detail Toggle */}
            {parsed.detail && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setDetailOpen(!detailOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[12px] font-medium text-muted-foreground">
                      {detailOpen ? "Ocultar detalhamento" : "Ver detalhamento completo"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${detailOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    detailOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-border px-4 py-3 text-[14px] leading-relaxed text-foreground">
                      <MarkdownBlock content={parsed.detail} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Fallback: single card for unstructured responses */
          <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-md text-[14px] leading-relaxed text-foreground">
            <MarkdownBlock content={content} />
          </div>
        )}

        {/* Feedback buttons */}
        {logId && (
          <div className={`flex gap-0.5 ml-2 ${feedback ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
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
          <img src={nextfitLogo} alt="" width={18} height={18} className="rounded object-contain" />
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
