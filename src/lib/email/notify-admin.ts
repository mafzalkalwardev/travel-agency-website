import { getBookingAdminEmail, isEmailConfigured, sendEmail } from "@/lib/email/resend";

/**
 * Fire-and-forget admin alert for important user activity.
 * Never throws to callers — signup/booking/inquiry flows must stay reliable.
 */
export async function notifyAdminActivity(params: {
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, skipped: true, error: "Email not configured" };
  }

  const to = getBookingAdminEmail();
  if (!to) {
    return { ok: false, skipped: true, error: "No admin email configured" };
  }

  try {
    return await sendEmail({
      to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Admin notify failed" };
  }
}
