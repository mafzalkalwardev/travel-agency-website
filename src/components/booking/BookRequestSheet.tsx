"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApprovalMessage } from "@/lib/customer-approval";
import { SITE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { buildBookingWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { BookingProductType } from "@/types";

interface BookRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: BookingProductType;
  productTitle: string;
  quotedPrice: number;
  currency?: string;
  ticketId?: string;
  umrahPackageId?: string;
  tourPackageId?: string;
  externalProductId?: string;
  sourcePage?: string;
}

export function BookRequestSheet({
  open,
  onOpenChange,
  productType,
  productTitle,
  quotedPrice,
  currency = "PKR",
  ticketId,
  umrahPackageId,
  tourPackageId,
  externalProductId,
  sourcePage,
}: BookRequestSheetProps) {
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    passengers: "1",
    passengerNames: "",
    notes: "",
  });

  const nextPath = sourcePage || "/account/";

  useEffect(() => {
    if (!open) return;

    let active = true;
    setAuthChecked(false);
    setError("");

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      const user = data.user;
      setSignedIn(Boolean(user));
      setAuthChecked(true);

      if (!user) return;

      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("full_name, phone, email, approval_status")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      setApprovalStatus((profile?.approval_status as "pending" | "approved" | "rejected" | undefined) || "pending");

      setForm((current) => ({
        ...current,
        name: current.name || String(profile?.full_name || user.user_metadata?.full_name || ""),
        phone: current.phone || String(profile?.phone || user.user_metadata?.phone || ""),
        email: current.email || String(profile?.email || user.email || ""),
      }));
    });

    return () => {
      active = false;
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_type: productType,
          ticket_id: ticketId,
          umrah_package_id: umrahPackageId,
          tour_package_id: tourPackageId,
          external_product_id: externalProductId,
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email || undefined,
          passengers: Number(form.passengers) || 1,
          quoted_price: quotedPrice,
          currency,
          product_title: productTitle,
          source_page: sourcePage,
          passenger_details: {
            names: form.passengerNames,
            notes: form.notes,
          },
        }),
      });
      const json = await res.json();
      if (res.status === 401) {
        window.location.href = `/account/login/?next=${encodeURIComponent(nextPath)}`;
        return;
      }
      if (res.status === 403) {
        throw new Error(json.error || "Your account is awaiting approval.");
      }
      if (!res.ok) throw new Error(json.error || "Request failed");
      const ref = json.bookingRef || "";

      const waMsg = buildBookingWhatsAppMessage({
        bookingRef: ref,
        productTitle,
        customerName: form.name,
        customerPhone: form.phone,
        passengers: Number(form.passengers) || 1,
        quotedPrice,
        currency,
        supplierRef: json.supplierRef || undefined,
      });
      window.location.href = whatsappLink(waMsg);
      return;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit booking request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading text-navy">Hold & Book</SheetTitle>
          <SheetDescription>
            Approved agents can place a supplier hold instantly, then complete payment on WhatsApp.
          </SheetDescription>
        </SheetHeader>

        {!authChecked ? (
          <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Checking account session...
          </div>
        ) : !signedIn ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <p className="font-medium text-navy">{productTitle}</p>
              <p className="font-bold text-gold">
                {quotedPrice.toLocaleString()} {currency}
              </p>
            </div>
            <div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm text-muted-foreground">
              Create an account or sign in before booking. Your passenger details, requests, and status updates will be saved in My Trips.
            </div>
            <Link
              href={`/account/signup/?next=${encodeURIComponent(nextPath)}`}
              className={cn(buttonVariants({ variant: "primaryGold" }), "w-full")}
            >
              Create Account
            </Link>
            <Link
              href={`/account/login/?next=${encodeURIComponent(nextPath)}`}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Sign In
            </Link>
          </div>
        ) : approvalStatus !== "approved" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <p className="font-medium text-navy">{productTitle}</p>
              <p className="font-bold text-gold">
                {quotedPrice.toLocaleString()} {currency}
              </p>
            </div>
            <div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm text-muted-foreground">
              {getApprovalMessage(approvalStatus || "pending")}
            </div>
            <Link href="/account/" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Open My Trips
            </Link>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "primaryGold" }), "w-full")}
            >
              Contact on WhatsApp
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <p className="font-medium text-navy">{productTitle}</p>
              <p className="font-bold text-gold">
                {quotedPrice.toLocaleString()} {currency}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="br-name">Full name</Label>
              <Input id="br-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="br-phone">Phone / WhatsApp</Label>
              <Input id="br-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="br-email">Email</Label>
              <Input id="br-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="br-passengers">Passengers</Label>
              <Input id="br-passengers" type="number" min={1} value={form.passengers} onChange={(e) => setForm({ ...form, passengers: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="br-names">Passenger names</Label>
              <Textarea id="br-names" placeholder="One name per line" value={form.passengerNames} onChange={(e) => setForm({ ...form, passengerNames: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="br-notes">Notes (optional)</Label>
              <Textarea id="br-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {error && (
              <p className="rounded-md border border-red-accent/30 bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-navy text-white hover:bg-navy-light">
              {loading ? "Placing hold..." : "Hold Seats & Pay via WhatsApp"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Seats are held at the supplier when available. Complete bank transfer and share your screenshot on WhatsApp.
            </p>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

