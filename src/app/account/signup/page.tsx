import { redirect } from "next/navigation";
import { SignupForm } from "@/components/account/SignupForm";
import { AccountAccessShell } from "@/components/account/AccountAccessShell";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Create Sub-Agent Account",
  description: "Register your travel agency with full company details for administrator-approved B2B booking access.",
  path: "/account/signup/",
});

export default async function AccountSignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextPath = pickNext(params.next);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect(nextPath || "/account/");
  }

  return <AccountAccessShell mode="signup"><SignupForm nextPath={nextPath} /></AccountAccessShell>;
}

function pickNext(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/")) return "/account/";
  if (raw.startsWith("//")) return "/account/";
  return raw;
}
