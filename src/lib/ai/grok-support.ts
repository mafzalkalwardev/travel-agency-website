import { SITE, OFFICES } from "@/lib/constants";
import { dataProvider } from "@/lib/data-provider";

export function isGrokConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
}

function getGrokApiKey(): string | null {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || null;
}

async function buildInventoryBrief(): Promise<string> {
  try {
    const tickets = await dataProvider.getTickets();
    const live = tickets
      .filter((t) => t.status !== "sold_out" && t.seatsLeft > 0)
      .slice(0, 12)
      .map(
        (t) =>
          `${t.airline} ${t.flightNumber || ""} | ${t.from}→${t.to} | ${t.date} | ${t.price.toLocaleString()} ${t.currency} | ${t.seatsLeft} seats`
      );
    if (!live.length) return "No live group tickets currently listed (inventory may be updating).";
    return live.join("\n");
  } catch {
    return "Live inventory unavailable right now — guide the customer to Available Tickets or WhatsApp.";
  }
}

export async function buildSupportSystemPrompt(): Promise<string> {
  const inventory = await buildInventoryBrief();
  return `You are Al Qibla Travel Assistant — the official AI support agent for ${SITE.name} (${SITE.url}).

Voice: warm, professional, concise, and helpful. Use clear English; you may briefly greet in Urdu/Pashto if the customer writes that way, then continue helpfully.

What you know about the business:
- Services: domestic & international air ticketing (group flights), Umrah packages, visit visas, hotels, travel insurance, airport transfers, corporate/NGO travel, holiday tours.
- Regions: ${SITE.regions.join(", ")}.
- WhatsApp (preferred human handoff): ${SITE.whatsappNumber} — link ${SITE.whatsapp}
- Email: ${SITE.email}
- Phone (head office): ${OFFICES.headOffice.phone}
- Hours: ${SITE.businessHours}
- Booking flow on the website: customer must create an account → admin approves → they book → seats are held on Travel Line → they complete payment on WhatsApp → admin confirms.
- Important pages: /available-tickets/, /umrah-packages/, /tour-packages/, /account/signup/, /inquiry/, /contact/

Live group ticket snapshot (may change; always suggest checking the site for latest seats/prices):
${inventory}

Rules:
1. Help customers find the right ticket, route, date, Umrah package, or next step.
2. Never invent confirmed seat counts, PNRs, visas approvals, or prices beyond the snapshot — if unsure, say so and offer WhatsApp / Available Tickets.
3. Do not share admin URLs, credentials, supplier (Travel Line) internals, or internal ops details.
4. For payment: explain they pay Al Qibla via bank/Easypaisa/JazzCash then send proof on WhatsApp — do not invent bank account numbers unless provided in site payment instructions.
5. When ready to book or pay, give a clear next step (sign up, browse tickets, or WhatsApp).
6. Keep answers short (usually under 120 words) unless the customer asks for detail.
7. End actionable replies with one clear CTA.`;
}

export async function chatWithGrok(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>) {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    return {
      ok: false as const,
      error: "Support chat is not configured yet. Please WhatsApp us instead.",
    };
  }

  const system = await buildSupportSystemPrompt();
  const model = process.env.GROK_MODEL || process.env.XAI_MODEL || "grok-4.5";

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      max_tokens: 700,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      ok: false as const,
      error: data.error?.message || `Support chat unavailable (${res.status}). Try WhatsApp.`,
    };
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return { ok: false as const, error: "Empty reply from assistant. Please try again or WhatsApp us." };
  }

  return { ok: true as const, content };
}
