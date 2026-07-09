"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface SignupFormProps {
  nextPath: string;
}

export function SignupForm({ nextPath }: SignupFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.phone,
        },
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      await supabase.from("customer_profiles").upsert({
        id: data.user.id,
        email: form.email,
        full_name: form.fullName,
        phone: form.phone,
        approval_status: "pending",
      });
      router.push(nextPath || "/account/");
      router.refresh();
      return;
    }

    setStatus("success");
    setMessage("Account created. Check your email to confirm your account, then sign in. An admin must approve your account before you can place bookings.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          required
          autoComplete="name"
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-phone">Phone / WhatsApp</Label>
        <Input
          id="signup-phone"
          required
          autoComplete="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
      </div>
      {status !== "idle" && (
        <p className={`rounded-md border px-3 py-2 text-sm ${status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-accent/30 bg-red-accent/10 text-red-accent"}`}>
          {message}
        </p>
      )}
      <Button type="submit" variant="primaryGold" className="w-full" disabled={loading || status === "success"}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/account/login/?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-navy hover:text-gold">
          Sign in
        </Link>
      </p>
    </form>
  );
}

