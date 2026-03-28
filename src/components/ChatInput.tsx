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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
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
    <div className="bg-background px-4 py-4">
      <div className="mx-auto max-w-3xl">
        <div
          className="flex items-end gap-2 bg-card p-2 border border-border focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(107,45,139,0.12)]"
          style={{ borderRadius: "14px" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre objeções, produto, concorrência..."
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted font-light min-h-[36px] max-h-[160px]"
            rows={1}
            disabled={disabled}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderRadius: "10px" }}
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
