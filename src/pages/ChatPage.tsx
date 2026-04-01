import { useState, useRef, useEffect } from "react";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import nextfitLogo from "@/assets/nextfit-logo.png";
import { Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string; logId?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nextfit-chat`;

const SUGGESTIONS = [
  { text: "Quais são os principais diferenciais da Next Fit?", emoji: "🚀" },
  { text: "O que falar no começo de uma ligação?", emoji: "📞" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (input: string) => {
    const userMsg: Msg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string, logId?: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.logId) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent, logId } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent, logId }];
      });
    };

    try {
      const allMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text();
        throw new Error(errText || "Erro ao conectar com a IA");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (assistantContent) {
        const { data, error } = await supabase
          .from("logs")
          .insert({ pergunta: input, resposta: assistantContent })
          .select("id")
          .single();

        if (!error && data) {
          setMessages((prev) =>
            prev.map((m, i) =>
              i === prev.length - 1 && m.role === "assistant" ? { ...m, logId: data.id } : m
            )
          );
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao processar sua pergunta. Tente novamente.");
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="mb-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-primary/5 scale-150" />
                <img
                  src={nextfitLogo}
                  alt="Next Fit"
                  width={52}
                  height={52}
                  className="rounded-2xl relative"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary/60" />
              <span className="text-[11px] font-medium tracking-widest uppercase text-primary/60">
                Mentor de Vendas
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-2 leading-tight">
              Em que posso te ajudar?
            </h2>
            <p className="text-muted-foreground text-sm font-light max-w-sm mb-8 leading-relaxed">
              Playbook, objeções, concorrência e produto — tudo na ponta dos dedos.
            </p>

            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSend(s.text)}
                  className="text-[13px] px-3.5 py-2 rounded-xl border border-chip-border bg-chip text-chip-text hover:border-primary hover:bg-primary/[0.08] font-normal inline-flex items-center gap-1.5"
                >
                  <span>{s.emoji}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} logId={msg.logId} />
            ))}
            {isLoading && !messages.some((m, i) => m.role === "assistant" && i === messages.length - 1) && (
              <TypingIndicator />
            )}
          </div>
        )}
      </div>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
