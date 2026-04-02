import { SendHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const PLACEHOLDERS = [
  "Pergunte sobre objeções, produto, concorrência...",
  "Como contornar 'já tenho sistema'?",
  "Quais diferenciais apresentar numa call?",
  "Como fazer follow-up de proposta?",
];

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isTyping?: boolean;
}

export function ChatInput({ onSend, disabled, isTyping }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-5">
      <div className="mx-auto max-w-3xl">
        {isTyping && (
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="flex gap-1">
              <span className="typing-dot h-1 w-1 rounded-full bg-primary/60" />
              <span className="typing-dot h-1 w-1 rounded-full bg-primary/60" />
              <span className="typing-dot h-1 w-1 rounded-full bg-primary/60" />
            </div>
            <span className="text-[11px] text-muted-foreground/60 font-light">Mentor está digitando...</span>
          </div>
        )}
        <div className="focus-ring flex items-end gap-2 bg-card rounded-2xl border border-border px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            className="flex-1 resize-none bg-transparent text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/40 font-light min-h-[24px] max-h-[140px] py-0.5"
            rows={1}
            disabled={disabled}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl disabled:opacity-20 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{ background: "var(--gradient-primary)" }}
          >
            <SendHorizontal className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/30 mt-2 font-light">
          Mentor Next Fit · Respostas baseadas nos manuais oficiais
        </p>
      </div>
    </div>
  );
}
