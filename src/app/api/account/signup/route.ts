import { NextResponse } from "next/server";
import { z } from "zod";
import { SITE } from "@/lib/constants";
import { accountVerificationCustomerHtml } from "@/lib/email/templates";
import { getAuthFromEmail, isEmailConfigured, sendEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().email().max(200),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(8).max(400),
  password: z.string().min(8).max(200),
  nextPath: z.string().trim().max(300).optional(),
});

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE.url).replace(/\/$/, "");
}

function safeNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) return "/account/";
  return nextPath;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Company email is not configured. Set RESEND_API_KEY and AUTH_FROM_EMAIL (or BOOKING_FROM_EMAIL) to a verified Al Qibla address such as noreply@flywithalqibla.com.",
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

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Please provide company name, contact person, phone, email, city, full address and password.",
      },
      { status: 400 }
    );
  }

  const { companyName, fullName, phone, email, city, address, password, nextPath } = parsed.data;
  const redirectTo = `${siteOrigin()}/account/login/?next=${encodeURIComponent(safeNextPath(nextPath))}`;
  const admin = createAdminClient();

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        company_name: companyName,
        city,
        address,
        role: "agent",
      },
      redirectTo,
    },
  });

  if (linkError) {
    const msg = linkError.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  const confirmUrl = linkData.properties?.action_link;

  if (!confirmUrl || typeof confirmUrl !== "string" || !confirmUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "Could not create a verification link. Please try again or contact support." },
      { status: 500 }
    );
  }

  const userId = linkData.user?.id;
  if (userId) {
    await admin.from("customer_profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      phone,
      company_name: companyName,
      city,
      address,
      role: "agent",
      approval_status: "pending",
    });
  }

  const mailed = await sendEmail({
    to: email,
    from: getAuthFromEmail(),
    replyTo: SITE.email,
    subject: `Confirm your ${SITE.name} agent account`,
    html: accountVerificationCustomerHtml({ fullName, confirmUrl }),
  });

  if (!mailed.ok) {
    return NextResponse.json(
      {
        error:
          mailed.error ||
          "Could not send the verification email. Verify your Resend domain and AUTH_FROM_EMAIL (e.g. noreply@flywithalqibla.com).",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Agent application submitted. Check your email for a verification message from Al Qibla Air Services, then sign in. An admin must approve your company before bookings.",
    from: getAuthFromEmail(),
  });
}
