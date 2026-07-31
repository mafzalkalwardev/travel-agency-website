import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SITE } from "@/lib/constants";

/**
 * Admin can set a user's password directly, or email a reset link.
 * Body:
 *   { password: "new-password" }           → update password now
 *   { send_reset: true }                   → email recovery link
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    password?: string;
    send_reset?: boolean;
  };

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("id, email, full_name")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (body.send_reset) {
    if (!profile.email) {
      return NextResponse.json({ error: "Customer has no email on file" }, { status: 400 });
    }
    const redirectTo = `${SITE.url.replace(/\/$/, "")}/account/reset-password/`;
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: profile.email,
      options: { redirectTo },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Prefer sending via our app email when available; otherwise return the link for admin copy.
    const actionLink = data.properties?.action_link || null;
    try {
      const { isEmailConfigured, sendEmail } = await import("@/lib/email/resend");
      const { accountPasswordResetCustomerHtml } = await import("@/lib/email/templates");
      if (actionLink && isEmailConfigured()) {
        const result = await sendEmail({
          to: profile.email,
          subject: `Reset your ${SITE.name} password`,
          html: accountPasswordResetCustomerHtml({
            fullName: profile.full_name || "there",
            resetUrl: actionLink,
          }),
        });
        if (result.ok) {
          return NextResponse.json({ success: true, mode: "email_sent" });
        }
      }
    } catch {
      /* fall through to return link */
    }

    return NextResponse.json({
      success: true,
      mode: "link",
      resetLink: actionLink,
      message: actionLink
        ? "Reset link generated — copy and send to the customer if email was not sent."
        : "Could not generate reset link",
    });
  }

  const password = String(body.password || "");
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mode: "updated" });
}
