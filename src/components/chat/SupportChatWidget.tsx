"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquareText, Send, Sparkles, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/SocialIcons";
import { LOGO_NAV_PATH, SITE } from "@/lib/constants";
import { assetPath } from "@/lib/base-path";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const STARTER: Msg = {
  role: "assistant",
  content:
    "Assalam o Alaikum — I'm Al Qibla's travel assistant. Ask about group tickets, Umrah, visas, or how to book. Pick a suggestion below or type your question.",
};

const SUGGESTIONS = [
  "Show me flights to Jeddah this month",
  "How do I book a group ticket?",
  "Umrah package options from Pakistan",
  "What documents do I need for booking?",
  "How does WhatsApp payment work?",
] as const;

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([STARTER]);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const showSuggestions = messages.length <= 1 && !loading;

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
        body: JSON.stringify({ messages: nextMessages }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not reach support.");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I couldn't complete that reply just now. Please continue on WhatsApp: ${SITE.whatsappNumber}`,
          },
        ]);
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
        <div className="flex h-[min(74vh,620px)] w-[min(100vw-1.25rem,400px)] flex-col overflow-hidden rounded-[1.35rem] border border-white/20 bg-[#0b1f3a] shadow-[0_28px_90px_rgba(4,18,40,.45)]">
          <div className="relative overflow-hidden border-b border-white/10 px-4 py-3.5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(201,162,39,.28),transparent_42%),linear-gradient(135deg,#0b1f3a,#123054)]"
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Image
                    src={assetPath(LOGO_NAV_PATH)}
                    alt=""
                    width={36}
                    height={36}
                    className="h-8 w-8 object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    Al Qibla Assistant
                    <Sparkles className="h-3.5 w-3.5 text-gold" />
                  </p>
                  <p className="text-[11px] text-white/55">Online · tickets, Umrah & booking help</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/65 hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f3f0ea] px-3.5 py-4">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 shadow-sm",
                    m.role === "user"
                      ? "rounded-br-md bg-navy text-white"
                      : "rounded-bl-md border border-navy/5 bg-white text-navy"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="space-y-2 pt-1">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45">
                  Suggested questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="rounded-full border border-navy/10 bg-white px-3 py-1.5 text-left text-[12px] font-medium text-navy/80 shadow-sm transition hover:border-gold/50 hover:bg-gold/10 hover:text-navy"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-navy/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" /> Finding the best answer…
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
                placeholder="Ask about flights, Umrah, booking…"
                className="h-11 flex-1 rounded-xl border border-navy/10 bg-[#faf8f4] px-3.5 text-sm text-navy outline-none ring-gold/40 placeholder:text-navy/35 focus:ring-2"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-navy transition hover:bg-gold-light disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#128C7E] hover:underline"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" /> Prefer a human? Continue on WhatsApp
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex h-14 items-center gap-2 rounded-full bg-navy px-2 pr-4 text-white shadow-[0_14px_44px_rgba(7,29,56,.4)] ring-1 ring-gold/30 transition hover:-translate-y-0.5 hover:bg-navy-light"
        aria-label={open ? "Close support chat" : "Open support chat"}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-navy shadow-inner">
          {open ? <X className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
        </span>
        <span className="text-sm font-semibold tracking-wide">{open ? "Close" : "Chat"}</span>
      </button>
    </div>
  );
}
