import { redirect } from "next/navigation";
import { SignupForm } from "@/components/account/SignupForm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Create Customer Account",
  description: "Create an Al Qibla customer profile before submitting booking requests.",
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

  return (
    <section className="bg-slate-50 py-14">
      <div className="container-wide">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-white p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-navy">Create your travel account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your profile saves contact, passenger, and booking information for faster follow-up. After signup, an admin will review and approve your account before booking is enabled.
          </p>
          <div className="mt-6">
            <SignupForm nextPath={nextPath} />
          </div>
        </div>
      </div>
    </section>
  );
}

function pickNext(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/")) return "/account/";
  if (raw.startsWith("//")) return "/account/";
  return raw;
}

