"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCodeExchanger } from "@/components/account/AuthCodeExchanger";
import { createClient } from "@/lib/supabase/client";

interface LoginFormProps {
  nextPath: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      const msg = authError.message || "Sign in failed";
      if (/email not confirmed/i.test(msg)) {
        setError(
          "Email not confirmed yet. Open the verification link we sent, then try again. Check spam if you do not see it."
        );
      } else if (/invalid login credentials/i.test(msg)) {
        setError("Invalid email or password. Use Forgot password if you need a reset.");
      } else {
        setError(msg);
      }
      setLoading(false);
      return;
    }

    router.push(nextPath || "/account/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthCodeExchanger
        onDone={(ok) => {
          if (ok) {
            router.replace(nextPath || "/account/");
            router.refresh();
          }
        }}
      />
      <div className="space-y-2.5">
        <Label htmlFor="login-email" className="font-semibold text-navy">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a66d2f]" />
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-4 shadow-inner shadow-navy/[0.02] focus-visible:border-gold focus-visible:ring-gold/20"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="login-password" className="font-semibold text-navy">Password</Label>
          <Link
            href={`/account/forgot-password/?next=${encodeURIComponent(nextPath)}`}
            className="text-xs font-semibold text-[#a66d2f] transition hover:text-navy"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a66d2f]" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-12 shadow-inner shadow-navy/[0.02] focus-visible:border-gold focus-visible:ring-gold/20"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-navy" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {error && (
        <p className="rounded-md border border-red-accent/30 bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
          {error}
        </p>
      )}
      <Button type="submit" variant="primaryGold" className="h-13 w-full rounded-xl text-base shadow-lg shadow-gold/20" disabled={loading}>
        {loading ? "Signing in securely..." : <>Sign in securely <ArrowRight className="ml-2 h-4 w-4" /></>}
      </Button>
      <p className="flex items-start gap-2 rounded-xl border border-[#d8c7ad] bg-[#f5eee2] px-4 py-3 text-xs leading-5 text-[#725637]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> New profiles can sign in immediately; booking access activates after administrator approval.
      </p>
      <p className="text-center text-sm text-slate-500">
        New customer?{" "}
        <Link href={`/account/signup/?next=${encodeURIComponent(nextPath)}`} className="font-bold text-navy transition hover:text-[#a66d2f]">
          Create your account
        </Link>
      </p>
    </form>
  );
}
