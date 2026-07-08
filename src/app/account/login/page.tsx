import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Customer Sign In",
  description: "Sign in to manage Al Qibla booking requests and travel details.",
  path: "/account/login/",
});

export default async function AccountLoginPage({
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
          <h1 className="font-heading text-2xl font-bold text-navy">Sign in to book</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Customers need an account before booking so trip details, passengers, and status updates stay in one profile.
          </p>
          <div className="mt-6">
            <LoginForm nextPath={nextPath} />
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

