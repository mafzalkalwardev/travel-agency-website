"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, CalendarDays, CheckCircle2, Clock3, Plane, ShieldCheck, Users } from "lucide-react";
import { AirlineLogo } from "@/components/shared/AirlineLogo";
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
import { cn } from "@/lib/utils";
import type { BookingProductType, Ticket } from "@/types";

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
  ticket?: Ticket;
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
  ticket,
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

      // Redirect to our own confirmation page (same order id TravelLine
      // itself would show) instead of jumping straight to WhatsApp — see
      // docs/REDESIGN.md §8.2. Payment/WhatsApp is now a CTA on that page.
      window.location.href = `/account/bookings/${ref}/`;
      return;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit booking request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex !w-[min(96vw,64rem)] !max-w-none flex-col overflow-y-auto p-0 sm:!max-w-4xl">
        <SheetHeader className="border-b bg-navy px-6 py-5 text-white sm:px-8">
          <SheetTitle className="font-heading text-2xl text-white">Review & hold your booking</SheetTitle>
          <SheetDescription>
            Confirm the live itinerary and fare before continuing. Approved accounts can place a supplier hold instantly.
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-8 sm:px-8">
          {ticket ? <TicketBookingDetails ticket={ticket} /> : (
            <div className="mt-6 rounded-2xl border bg-secondary/40 p-5"><p className="font-semibold text-navy">{productTitle}</p><p className="mt-1 text-xl font-bold text-gold">{quotedPrice.toLocaleString()} {currency}</p></div>
          )}

        {!authChecked ? (
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Checking account session...
          </div>
        ) : !signedIn ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-gold/30 bg-gold/10 p-5 text-sm leading-6 text-muted-foreground">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TicketBookingDetails({ ticket }: { ticket: Ticket }) {
  const segments = ticket.segments?.length ? ticket.segments : [];
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-5 bg-gradient-to-r from-navy to-navy-light p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><AirlineLogo code={ticket.airlineCode} name={ticket.airline} size="md" /><div><p className="text-xs font-bold uppercase tracking-[.16em] text-gold-light">Operated by</p><h3 className="mt-1 text-xl font-bold">{ticket.airline}</h3><p className="text-sm text-white/60">{ticket.flightNumber} · {ticket.sector}</p></div></div>
        <div className="sm:text-right"><p className="text-xs uppercase tracking-[.14em] text-white/50">Fare per traveler</p><p className="mt-1 text-2xl font-bold text-gold">{ticket.currency} {ticket.price.toLocaleString("en-PK")}</p><p className="text-xs text-white/50">Live fare · subject to supplier confirmation</p></div>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_230px]">
        <div className="space-y-4">
          {(segments.length ? segments : [{
            flightNumber: ticket.flightNumber, airline: ticket.airline, airlineCode: ticket.airlineCode,
            departureAirport: ticket.fromCity, departureCode: ticket.from, departureCity: ticket.fromCity,
            departureDatetime: `${ticket.date}T${ticket.departureTime || "00:00"}`, arrivalAirport: ticket.toCity,
            arrivalCode: ticket.to, arrivalCity: ticket.toCity, arrivalDatetime: `${ticket.date}T${ticket.arrivalTime || "00:00"}`,
          }]).map((segment, index) => (
            <div key={`${segment.flightNumber}-${index}`} className="relative grid gap-4 rounded-xl border bg-slate-50 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Departure</p><p className="mt-1 text-2xl font-bold text-navy">{segment.departureCode}</p><p className="text-sm">{segment.departureCity}</p><p className="text-xs text-muted-foreground">{formatDateTime(segment.departureDatetime)}</p></div>
              <div className="flex min-w-28 flex-col items-center"><Plane className="h-5 w-5 text-gold" /><div className="my-2 h-px w-full bg-gold/40" /><p className="text-xs font-semibold text-navy">{segment.flightNumber}</p></div>
              <div className="sm:text-right"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Arrival</p><p className="mt-1 text-2xl font-bold text-navy">{segment.arrivalCode}</p><p className="text-sm">{segment.arrivalCity}</p><p className="text-xs text-muted-foreground">{formatDateTime(segment.arrivalDatetime)}</p></div>
            </div>
          ))}
        </div>
        <aside className="rounded-xl border bg-secondary/40 p-4 text-sm">
          <p className="font-bold text-navy">Fare details</p>
          <ul className="mt-4 space-y-3 text-muted-foreground">
            <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold" />{new Date(`${ticket.date}T00:00:00`).toLocaleDateString("en-PK", { dateStyle: "medium" })}</li>
            <li className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-gold" />{ticket.duration || "Duration TBA"}</li>
            <li className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-gold" />{ticket.baggage || "Baggage TBA"}</li>
            <li className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" />{ticket.seatsLeft} live seats</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gold" />{ticket.meal || "Meal not specified"}</li>
          </ul>
          <div className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />No payment is collected here. A supplier hold is attempted only after an approved account submits traveler details.</div>
        </aside>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
