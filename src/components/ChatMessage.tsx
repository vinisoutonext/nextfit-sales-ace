import { useState } from "react";
import { ThumbsUp, ThumbsDown, ChevronDown, Zap, BookOpen, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import nextfitLogo from "@/assets/nextfit-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  logId?: string;
}

function parseResponse(content: string) {
  const quickMarkers = ["⚡ resposta rápida", "⚡ Resposta Rápida", "**⚡ Resposta Rápida**", "## ⚡ Resposta Rápida", "### ⚡ Resposta Rápida"];
  const detailMarkers = ["📖 detalhamento", "📖 Detalhamento", "**📖 Detalhamento**", "## 📖 Detalhamento", "### 📖 Detalhamento"];

  const lowerContent = content.toLowerCase();
  let quickIdx = -1;
  let detailIdx = -1;

  for (const m of quickMarkers) {
    const idx = lowerContent.indexOf(m.toLowerCase());
    if (idx !== -1) { quickIdx = idx; break; }
  }
  for (const m of detailMarkers) {
    const idx = lowerContent.indexOf(m.toLowerCase());
    if (idx !== -1) { detailIdx = idx; break; }
  }

  if (quickIdx !== -1 && detailIdx !== -1 && detailIdx > quickIdx) {
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
      prose-headings:text-foreground prose-headings:font-display prose-headings:text-[15px] prose-headings:mt-3 prose-headings:mb-1.5
      prose-strong:text-primary prose-strong:font-medium
      prose-ul:my-1.5 prose-li:my-0.5 prose-li:leading-relaxed
      prose-ol:my-1.5
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
  const [copied, setCopied] = useState(false);

  const handleFeedback = async (value: "positivo" | "negativo") => {
    if (feedback || !logId) return;
    setFeedback(value);
    await supabase.from("logs").update({ avaliacao: value }).eq("id", logId);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="animate-message-in flex justify-end px-4 sm:px-6 py-2">
        <div className="max-w-[80%] sm:max-w-[70%] px-4 py-3 text-[14px] leading-relaxed text-primary-foreground rounded-2xl rounded-br-md"
          style={{ background: "var(--gradient-user-bubble)" }}>
          {content}
        </div>
      </div>
    );
  }

  const parsed = parseResponse(content);

  return (
    <div className="animate-message-in flex gap-3 px-4 sm:px-6 py-2 group">
      <div className="shrink-0 mt-1">
        <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center shadow-sm">
          <img src={nextfitLogo} alt="" width={20} height={20} className="rounded-md object-contain" />
        </div>
      </div>
      <div className="flex flex-col min-w-0 max-w-[85%] sm:max-w-[78%] gap-2.5">
        {parsed ? (
          <>
            {/* Quick Response Card */}
            <div className="bg-card border border-border rounded-2xl rounded-tl-md overflow-hidden accent-bar-left hover-lift">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-primary">
                    Resposta Rápida
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(parsed.quick)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-accent text-[10px] font-medium"
                  title="Copiar resposta"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500 animate-copied">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span className="hidden sm:inline">Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <div className="px-4 pb-3.5 text-[14px] leading-relaxed text-foreground">
                <MarkdownBlock content={parsed.quick} />
              </div>
            </div>

            {/* Detail Toggle */}
            {parsed.detail && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden hover-lift">
                <button
                  onClick={() => setDetailOpen(!detailOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/40 text-left group/detail"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-accent flex items-center justify-center">
                      <BookOpen className="h-3 w-3 text-muted-foreground group-hover/detail:text-primary" />
                    </div>
                    <span className="text-[12px] font-medium text-muted-foreground group-hover/detail:text-foreground">
                      {detailOpen ? "Ocultar detalhamento" : "Ver detalhamento completo"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ${detailOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    detailOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-border px-4 py-4 text-[14px] leading-relaxed text-foreground">
                      <MarkdownBlock content={parsed.detail} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-md text-[14px] leading-relaxed text-foreground hover-lift">
            <MarkdownBlock content={content} />
          </div>
        )}

        {/* Feedback buttons */}
        {logId && (
          <div className={`flex gap-1 ml-1 transition-opacity duration-200 ${feedback ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"}`}>
            <button
              onClick={() => handleFeedback("positivo")}
              disabled={!!feedback}
              className={`p-1.5 rounded-lg text-[10px] flex items-center gap-1 ${
                feedback === "positivo" ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground/40 hover:text-emerald-600 hover:bg-emerald-50"
              } disabled:cursor-default`}
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleFeedback("negativo")}
              disabled={!!feedback}
              className={`p-1.5 rounded-lg text-[10px] flex items-center gap-1 ${
                feedback === "negativo" ? "text-destructive bg-red-50" : "text-muted-foreground/40 hover:text-destructive hover:bg-red-50"
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
    <div className="animate-message-in flex gap-3 px-4 sm:px-6 py-2">
      <div className="shrink-0 mt-1">
        <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center shadow-sm">
          <img src={nextfitLogo} alt="" width={20} height={20} className="rounded-md object-contain" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3.5 bg-card border border-border rounded-2xl rounded-tl-md">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
    </div>
  );
}
