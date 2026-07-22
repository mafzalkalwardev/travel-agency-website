import { NextResponse } from "next/server";
import { chatWithGrok, isGrokConfigured } from "@/lib/ai/grok-support";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  try {
    if (!isGrokConfigured()) {
      return NextResponse.json(
        {
          error: "AI support is not configured yet. Please chat on WhatsApp.",
          whatsapp: SITE.whatsapp,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const incoming = Array.isArray(body.messages) ? (body.messages as ChatMessage[]) : [];
    const cleaned = incoming
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 2000) }))
      .filter((m) => m.content.length > 0)
      .slice(-12);

    if (!cleaned.length) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const result = await chatWithGrok(cleaned);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, whatsapp: SITE.whatsapp },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply: result.content });
  } catch {
    return NextResponse.json(
      { error: "Support chat failed. Please try WhatsApp.", whatsapp: SITE.whatsapp },
      { status: 500 }
    );
  }
}
