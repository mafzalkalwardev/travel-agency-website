"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquareText, Send, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/SocialIcons";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const STARTER: Msg = {
  role: "assistant",
  content:
    "Assalam o Alaikum — I'm Al Qibla's travel assistant. Ask me about group tickets, Umrah packages, routes, or how to book. I can also hand you to WhatsApp anytime.",
};

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([STARTER]);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("alqibla:open-support-chat", openChat);
    return () => window.removeEventListener("alqibla:open-support-chat", openChat);
  }, []);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat/support/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.filter((m) => m !== STARTER || nextMessages.length === 2),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not reach support.");
        if (json.whatsapp) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I couldn't complete that reply just now. Please continue on WhatsApp: ${SITE.whatsappNumber}`,
            },
          ]);
        }
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: String(json.reply) }]);
    } catch {
      setError("Network error. Please try again or use WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {open && (
        <div className="flex h-[min(70vh,560px)] w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_24px_80px_rgba(7,29,56,.28)]">
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Al Qibla Support</p>
              <p className="text-[11px] text-white/60">AI travel assistant · guided booking help</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f7f5f1] px-3 py-4">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                    m.role === "user"
                      ? "rounded-br-md bg-navy text-white"
                      : "rounded-bl-md border border-navy/5 bg-white text-navy shadow-sm"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          {error && <p className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <div className="border-t border-navy/10 bg-white p-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about tickets, Umrah, booking…"
                className="h-11 flex-1 rounded-xl border border-navy/10 bg-[#faf8f4] px-3 text-sm outline-none ring-gold/30 focus:ring-2"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#128C7E] hover:underline"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" /> Prefer a human? Continue on WhatsApp
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex h-14 items-center gap-2 rounded-full bg-navy px-4 text-white shadow-[0_12px_40px_rgba(7,29,56,.35)] transition hover:-translate-y-0.5 hover:bg-navy-light"
        aria-label={open ? "Close support chat" : "Open support chat"}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-navy">
          {open ? <X className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
        </span>
        <span className="pr-1 text-sm font-semibold tracking-wide">{open ? "Close" : "Chat"}</span>
      </button>
    </div>
  );
}
