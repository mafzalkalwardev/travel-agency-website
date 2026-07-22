import {
  customerApprovedHtml,
  customerRejectedHtml,
} from "@/lib/email/templates";
import { getAuthFromEmail, isEmailConfigured, sendEmail } from "@/lib/email/resend";

export async function sendCustomerApprovalEmail(params: {
  email: string;
  fullName?: string | null;
  status: "approved" | "rejected";
  notes?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!params.email || !isEmailConfigured()) {
    return { ok: false, error: "Email not configured or no recipient" };
  }

  if (params.status === "approved") {
    return sendEmail({
      to: params.email,
      from: getAuthFromEmail(),
      subject: "You're approved to book with Al Qibla",
      html: customerApprovedHtml({ fullName: params.fullName || undefined }),
    });
  }

  return sendEmail({
    to: params.email,
    from: getAuthFromEmail(),
    subject: "Update on your Al Qibla account",
    html: customerRejectedHtml({
      fullName: params.fullName || undefined,
      notes: params.notes,
    }),
  });
}
