import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";
import { AccountAccessShell } from "@/components/account/AccountAccessShell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Reset Password",
  description: "Choose a new password for your Al Qibla Air Services account.",
  path: "/account/reset-password/",
});

export default function ResetPasswordPage() {
  return (
    <AccountAccessShell mode="reset">
      <ResetPasswordForm />
    </AccountAccessShell>
  );
}
