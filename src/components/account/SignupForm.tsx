"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SignupFormProps {
  nextPath: string;
}

export function SignupForm({ nextPath }: SignupFormProps) {
  const [form, setForm] = useState({
    companyName: "",
    fullName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    password: "",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch("/api/account/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          city: form.city,
          address: form.address,
          password: form.password,
          nextPath,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(json.error || "Could not create your account.");
        setLoading(false);
        return;
      }

      setStatus("success");
      setMessage(
        json.message ||
          "Account created. Check your email from Al Qibla Air Services to confirm your account, then sign in."
      );
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PremiumField icon={Building2} id="signup-company" label="Company / agency name">
        <Input
          id="signup-company"
          required
          autoComplete="organization"
          placeholder="Registered travel agency name"
          className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-4 focus-visible:border-gold focus-visible:ring-gold/20"
          value={form.companyName}
          onChange={(event) => setForm({ ...form, companyName: event.target.value })}
        />
      </PremiumField>

      <div className="grid gap-4 sm:grid-cols-2">
        <PremiumField icon={UserRound} id="signup-name" label="Contact person full name">
          <Input
            id="signup-name"
            required
            autoComplete="name"
            placeholder="Your full name"
            className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-4 focus-visible:border-gold focus-visible:ring-gold/20"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </PremiumField>
        <PremiumField icon={Phone} id="signup-phone" label="Phone / WhatsApp">
          <Input
            id="signup-phone"
            required
            autoComplete="tel"
            placeholder="+92 300 0000000"
            className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-4 focus-visible:border-gold focus-visible:ring-gold/20"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </PremiumField>
      </div>

      <PremiumField icon={Mail} id="signup-email" label="Business email">
        <Input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          placeholder="bookings@youragency.com"
          className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-4 focus-visible:border-gold focus-visible:ring-gold/20"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </PremiumField>

      <div className="grid gap-4 sm:grid-cols-2">
        <PremiumField icon={MapPin} id="signup-city" label="City">
          <Input
            id="signup-city"
            required
            autoComplete="address-level2"
            placeholder="Peshawar, Islamabad, Lahore..."
            className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-4 focus-visible:border-gold focus-visible:ring-gold/20"
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
          />
        </PremiumField>
        <div className="space-y-2.5">
          <Label htmlFor="signup-password" className="font-semibold text-navy">
            Create password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a66d2f]" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className="h-13 rounded-xl border-navy/10 bg-[#faf8f4] pl-11 pr-12 focus-visible:border-gold focus-visible:ring-gold/20"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
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
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="signup-address" className="font-semibold text-navy">
          Company address
        </Label>
        <Textarea
          id="signup-address"
          required
          rows={3}
          autoComplete="street-address"
          placeholder="Office address, street, area / landmark"
          className="min-h-[88px] rounded-xl border-navy/10 bg-[#faf8f4] px-4 py-3 focus-visible:border-gold focus-visible:ring-gold/20"
          value={form.address}
          onChange={(event) => setForm({ ...form, address: event.target.value })}
        />
      </div>

      {status !== "idle" && (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-accent/30 bg-red-accent/10 text-red-accent"
          }`}
        >
          {message}
        </p>
      )}
      <p className="flex items-start gap-2 rounded-xl border border-[#d8c7ad] bg-[#f5eee2] px-4 py-3 text-xs leading-5 text-[#725637]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> You will receive a verification email from Al
        Qibla Air Services. Booking activates after administrator review of your agency details.
      </p>
      <Button
        type="submit"
        variant="primaryGold"
        className="h-13 w-full rounded-xl text-base shadow-lg shadow-gold/20"
        disabled={loading || status === "success"}
      >
        {loading ? (
          "Submitting application..."
        ) : (
          <>
            Submit agent application <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Already a partner?{" "}
        <Link
          href={`/account/login/?next=${encodeURIComponent(nextPath)}`}
          className="font-bold text-navy transition hover:text-[#a66d2f]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

function PremiumField({
  icon: Icon,
  id,
  label,
  children,
}: {
  icon: typeof UserRound;
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="font-semibold text-navy">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#a66d2f]" />
        {children}
      </div>
    </div>
  );
}
