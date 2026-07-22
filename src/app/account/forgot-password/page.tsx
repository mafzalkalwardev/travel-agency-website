import { ForgotPasswordForm } from "@/components/account/ForgotPasswordForm";
import { AccountAccessShell } from "@/components/account/AccountAccessShell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Forgot Password",
  description: "Reset your Al Qibla Air Services account password.",
  path: "/account/forgot-password/",
});

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextPath = pickNext(params.next);

  return (
    <AccountAccessShell mode="forgot">
      <ForgotPasswordForm nextPath={nextPath} />
    </AccountAccessShell>
  );
}

function pickNext(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/")) return "/account/";
  if (raw.startsWith("//")) return "/account/";
  return raw;
}
