"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();

      // Hash tokens from recovery redirect (#access_token=...) or ?code=
      const href = typeof window !== "undefined" ? window.location.href : "";
      if (href.includes("code=") || href.includes("access_token=")) {
        await supabase.auth.exchangeCodeForSession(href).catch(() => undefined);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) {
        setReady(Boolean(session));
        setChecking(false);
        if (!session) {
          setError("This reset link is invalid or has expired. Request a new one.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess("Password updated. Redirecting to your account...");
    setLoading(false);
    router.push("/account/");
    router.refresh();
  }

  if (checking) {
    return <p className="text-sm text-slate-600">Checking your reset link...</p>;
  }

  if (!ready) {
    return (
      <div className="space-y-5">
        <p className="rounded-md border border-red-accent/30 bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
          {error || "Reset link is not valid."}
        </p>
        <Link
          href="/account/forgot-password/"
          className="inline-flex font-bold text-navy transition hover:text-[#a66d2f]"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2.5">
        <Label htmlFor="reset-password" className="font-semibold text-navy">
          New password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a66d2f]" />
          <Input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-12 shadow-inner shadow-navy/[0.02] focus-visible:border-gold focus-visible:ring-gold/20"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-navy"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2.5">
        <Label htmlFor="reset-confirm" className="font-semibold text-navy">
          Confirm password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a66d2f]" />
          <Input
            id="reset-confirm"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Re-enter new password"
            className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-4 shadow-inner shadow-navy/[0.02] focus-visible:border-gold focus-visible:ring-gold/20"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>
      </div>
      {error && (
        <p className="rounded-md border border-red-accent/30 bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md border border-emerald-600/20 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      )}
      <Button
        type="submit"
        variant="primaryGold"
        className="h-13 w-full rounded-xl text-base shadow-lg shadow-gold/20"
        disabled={loading}
      >
        {loading ? (
          "Updating password..."
        ) : (
          <>
            Save new password <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="flex items-start gap-2 rounded-xl border border-[#d8c7ad] bg-[#f5eee2] px-4 py-3 text-xs leading-5 text-[#725637]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Use a strong password you do not reuse on other
        sites.
      </p>
    </form>
  );
}
