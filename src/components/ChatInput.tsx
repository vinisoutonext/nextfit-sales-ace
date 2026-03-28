import { SendHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);

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
    <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-2">
      <div className="mx-auto max-w-2xl">
        <div className="focus-ring flex items-end gap-2 bg-card rounded-2xl border border-border px-3 py-2 sm:px-4 sm:py-2.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre objeções, produto, concorrência..."
            className="flex-1 resize-none bg-transparent text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/50 font-light min-h-[24px] max-h-[140px] py-0.5"
            rows={1}
            disabled={disabled}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <SendHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/40 mt-1.5 font-light">
          Mentor Next Fit · Respostas baseadas nos manuais oficiais
        </p>
      </div>
    </div>
  );
}
