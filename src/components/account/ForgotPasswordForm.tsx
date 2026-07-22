"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ForgotPasswordFormProps {
  nextPath: string;
}

export function ForgotPasswordForm({ nextPath }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/account/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "Could not send reset email.");
        return;
      }
      setSuccess(data.message || "Check your email for a reset link.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2.5">
        <Label htmlFor="forgot-email" className="font-semibold text-navy">
          Email address
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a66d2f]" />
          <Input
            id="forgot-email"
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
          "Sending reset link..."
        ) : (
          <>
            Email me a reset link <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="flex items-start gap-2 rounded-xl border border-[#d8c7ad] bg-[#f5eee2] px-4 py-3 text-xs leading-5 text-[#725637]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> The link comes from Al Qibla Air Services and
        opens on flywithalqibla.com.
      </p>
      <p className="text-center text-sm text-slate-500">
        Remembered it?{" "}
        <Link
          href={`/account/login/?next=${encodeURIComponent(nextPath)}`}
          className="font-bold text-navy transition hover:text-[#a66d2f]"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
