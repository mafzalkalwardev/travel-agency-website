import { NextResponse } from "next/server";
import { z } from "zod";
import { SITE } from "@/lib/constants";
import { accountPasswordResetCustomerHtml } from "@/lib/email/templates";
import { getAuthFromEmail, isEmailConfigured, sendEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email().max(200),
});

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE.url).replace(/\/$/, "");
}

/** Always return a generic success to avoid account enumeration. */
function okResponse() {
  return NextResponse.json({
    ok: true,
    message:
      "If an account exists for that email, we sent a password reset link from Al Qibla Air Services. Check your inbox and spam folder.",
    from: getAuthFromEmail(),
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Company email is not configured. Set RESEND_API_KEY and AUTH_FROM_EMAIL to a verified address such as noreply@flywithalqibla.com.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const redirectTo = `${siteOrigin()}/account/reset-password/`;
  const admin = createAdminClient();

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  // Unknown / missing users still get a generic OK
  if (linkError) {
    const msg = linkError.message.toLowerCase();
    if (msg.includes("not found") || msg.includes("unable to find") || msg.includes("user")) {
      return okResponse();
    }
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  const resetUrl = linkData.properties?.action_link;
  if (!resetUrl || typeof resetUrl !== "string" || !resetUrl.startsWith("http")) {
    return okResponse();
  }

  const fullName =
    (typeof linkData.user?.user_metadata?.full_name === "string"
      ? linkData.user.user_metadata.full_name
      : "") || "";

  const mailed = await sendEmail({
    to: email,
    from: getAuthFromEmail(),
    replyTo: SITE.email,
    subject: `Reset your ${SITE.name} password`,
    html: accountPasswordResetCustomerHtml({ fullName, resetUrl }),
  });

  if (!mailed.ok) {
    return NextResponse.json(
      {
        error:
          mailed.error ||
          "Could not send the reset email. Verify your Resend domain and AUTH_FROM_EMAIL.",
      },
      { status: 502 }
    );
  }

  return okResponse();
}
