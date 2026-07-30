"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const fieldClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40";

export function ReviewForm() {
  const [authState, setAuthState] = useState<"loading" | "signed_out" | "signed_in">("loading");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthState("signed_out");
      return;
    }

    const supabase = createClient();

    async function sync(userId?: string | null, fullName?: string | null, userCity?: string | null) {
      if (!userId) {
        setAuthState("signed_out");
        return;
      }
      setAuthState("signed_in");
      setName((prev) => prev || fullName || "");
      setCity((prev) => prev || userCity || "");
    }

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        setAuthState("signed_out");
        return;
      }
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("full_name, city")
        .eq("id", user.id)
        .maybeSingle();
      sync(
        user.id,
        profile?.full_name || (user.user_metadata?.full_name as string | undefined) || null,
        profile?.city || null
      );
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setAuthState("signed_out");
        return;
      }
      setAuthState("signed_in");
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/reviews/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, service, rating, comment, consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatus("success");
      setMessage(data.message);
      setName("");
      setCity("");
      setService("");
      setComment("");
      setConsent(false);
      setRating(5);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again or contact us on WhatsApp.");
    }
  }

  if (authState === "loading") {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-sm text-navy/70 shadow-sm">
        Checking your account…
      </div>
    );
  }

  if (authState === "signed_out") {
    return (
      <div className="rounded-xl border border-gold/30 bg-white p-6 text-navy shadow-sm">
        <h3 className="font-heading text-lg font-bold">Sign in to write a review</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Reviews are only available for logged-in customers so we can verify real travel experiences before publishing.
        </p>
        <Link
          href="/account/login/?next=/about/"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-gold px-4 text-sm font-semibold text-navy transition hover:bg-gold-light"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-gold/30 bg-gold/10 p-6 text-center text-navy">
        <p className="font-medium">{message}</p>
        <Button variant="outlineDark" className="mt-4" onClick={() => setStatus("idle")}>
          Write another review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-white p-6 text-navy shadow-sm">
      <h3 className="font-heading text-lg font-bold text-navy">Write a Review</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy" htmlFor="review-name">
            Name *
          </label>
          <input
            id="review-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy" htmlFor="review-city">
            City
          </label>
          <input
            id="review-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-navy" htmlFor="review-service">
          Service used
        </label>
        <input
          id="review-service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="Umrah Package, Air Ticket, Visa..."
          className={fieldClass}
        />
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium text-navy">Your rating *</span>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-navy" htmlFor="review-comment">
          Your review *
        </label>
        <textarea
          id="review-comment"
          required
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={fieldClass}
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        I agree that Al Qibla may display my review on the website.
      </label>
      {status === "error" && <p className="text-sm text-red-accent">{message}</p>}
      <Button type="submit" variant="primaryGold" disabled={status === "loading"}>
        {status === "loading" ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
