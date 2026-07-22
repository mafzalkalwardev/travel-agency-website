import { Resend } from "resend";
import { SITE } from "@/lib/constants";

let resendClient: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && (process.env.BOOKING_FROM_EMAIL || process.env.AUTH_FROM_EMAIL));
}

/** Booking / transactional From address (with display name). */
export function getBookingFromEmail(): string {
  const addr =
    process.env.BOOKING_FROM_EMAIL ||
    process.env.AUTH_FROM_EMAIL ||
    "noreply@flywithalqibla.com";
  return withDisplayName(addr);
}

/**
 * Auth verification / account emails — prefer noreply so customers see
 * Al Qibla branding instead of Supabase's default mailer.
 */
export function getAuthFromEmail(): string {
  const addr =
    process.env.AUTH_FROM_EMAIL ||
    process.env.BOOKING_FROM_EMAIL ||
    "noreply@flywithalqibla.com";
  return withDisplayName(addr);
}

export function getBookingAdminEmail(): string {
  return (
    process.env.BOOKING_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "salesalqibla@gmail.com"
  );
}

function withDisplayName(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return `Al Qibla Air Services <noreply@flywithalqibla.com>`;
  if (trimmed.includes("<") && trimmed.includes(">")) return trimmed;
  return `${SITE.name} <${trimmed}>`;
}

/** True when using Resend test sender or explicit sandbox flag (Vercel pre-domain testing). */
export function isResendSandboxMode(): boolean {
  if (process.env.RESEND_SANDBOX_MODE === "true") return true;
  if (process.env.RESEND_SANDBOX_MODE === "false") return false;
  const raw = (process.env.AUTH_FROM_EMAIL || process.env.BOOKING_FROM_EMAIL || "").toLowerCase();
  return raw.includes("@resend.dev");
}

function applySandboxRouting(to: string, subject: string, html: string) {
  if (!isResendSandboxMode()) return { to, subject, html };

  const admin = getBookingAdminEmail();
  if (!admin || to === admin) return { to, subject, html };

  return {
    to: admin,
    subject: `[Sandbox — would go to ${to}] ${subject}`,
    html: `<p style="background:#fff3cd;padding:12px;border-radius:6px;font-size:13px;margin:0 0 16px">
      <strong>Sandbox mode:</strong> Routed to admin for Vercel testing. Intended recipient: ${to}
    </p>${html}`,
  };
}

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const client = getResendClient();
  if (!client) return { ok: false, error: "Email not configured" };

  const routed = applySandboxRouting(params.to, params.subject, params.html);

  const { error } = await client.emails.send({
    from: params.from || getBookingFromEmail(),
    to: routed.to,
    subject: routed.subject,
    html: routed.html,
    replyTo: params.replyTo || SITE.email,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
