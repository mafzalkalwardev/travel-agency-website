import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";
import {
  clearLoginAttempts,
  consumeLoginAttempt,
  getClientIp,
} from "@/lib/admin/login-rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

const GENERIC_FAILURE = "Invalid email or password.";
const UNAUTHORIZED_ROLE = "Access denied. This account is not authorized for admin.";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Admin sign-in is temporarily unavailable." },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  const rateKey = `admin-login:${ip}`;
  const rate = consumeLoginAttempt(rateKey);
  if (rate.blocked) {
    const retryAfterSec = Math.ceil(rate.retryAfterMs / 1000) || 60;
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Cookies are only attached to the success response — failed attempts never
  // leave a session cookie in the browser.
  const successResponse = NextResponse.json({ ok: true });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          successResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  const role = profile?.role;
  if (!role || !["admin", "editor"].includes(role)) {
    // Revoke server session; do not return the successResponse that holds session cookies.
    await supabase.auth.signOut({ scope: "global" }).catch(() => undefined);
    return NextResponse.json({ error: UNAUTHORIZED_ROLE }, { status: 403 });
  }

  clearLoginAttempts(rateKey);
  return successResponse;
}
