"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Plane,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AirlineLogo } from "@/components/shared/AirlineLogo";
import { resolveAirlineName } from "@/data/airlines";
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
import {
  buildPassengerDetailsPayload,
  emptyTraveler,
  type TravelerDetails,
} from "@/lib/booking/passenger-names";
import { PAYMENT, SITE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { buildBookingWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import type { BookingProductType, Ticket } from "@/types";

const WHATSAPP_REDIRECT_SECONDS = 8;

function emptyTravelers(count: number): TravelerDetails[] {
  return Array.from({ length: Math.max(1, count) }, () => emptyTraveler());
}

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
  const [success, setSuccess] = useState<{
    bookingRef: string;
    whatsappUrl: string;
    supplierHeld: boolean;
  } | null>(null);
  const [countdown, setCountdown] = useState(WHATSAPP_REDIRECT_SECONDS);
  const redirectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    passengers: "1",
    travelers: emptyTravelers(1),
  });

  function setPassengerCount(value: string) {
    const count = Math.max(1, Number(value) || 1);
    setForm((current) => {
      const travelers = [...current.travelers];
      while (travelers.length < count) travelers.push(emptyTraveler());
      return {
        ...current,
        passengers: String(count),
        travelers: travelers.slice(0, count),
      };
    });
  }

  function updateTraveler(index: number, patch: Partial<TravelerDetails>) {
    setForm((current) => ({
      ...current,
      travelers: current.travelers.map((traveler, i) =>
        i === index ? { ...traveler, ...patch } : traveler
      ),
    }));
  }

  const nextPath = sourcePage || "/account/";

  function clearRedirectTimer() {
    if (redirectTimerRef.current) {
      clearInterval(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }

  function goToWhatsApp(url: string) {
    clearRedirectTimer();
    window.location.href = url;
  }

  function startWhatsAppCountdown(url: string) {
    clearRedirectTimer();
    setCountdown(WHATSAPP_REDIRECT_SECONDS);
    redirectTimerRef.current = setInterval(() => {
      setCountdown((seconds) => {
        if (seconds <= 1) {
          clearRedirectTimer();
          window.location.href = url;
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (!open) {
      clearRedirectTimer();
      setSuccess(null);
      setCountdown(WHATSAPP_REDIRECT_SECONDS);
      setError("");
      return;
    }

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
      clearRedirectTimer();
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const passengerDetails = buildPassengerDetailsPayload({
        travelers: form.travelers,
      });
      if (!passengerDetails.travelers.length) {
        throw new Error("Enter first name and last name for each passenger (as on passport).");
      }

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
          passenger_details: passengerDetails,
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
      const ref = String(json.bookingRef || "");
      const wa = json.whatsapp as
        | {
            productTitle?: string;
            customerName?: string;
            customerPhone?: string;
            passengers?: number;
            quotedPrice?: number;
            currency?: string;
            supplierRef?: string | null;
          }
        | undefined;

      const passengerNames = passengerDetails.names;
      const waMsg = buildBookingWhatsAppMessage({
        bookingRef: ref,
        productTitle: wa?.productTitle || productTitle,
        customerName: wa?.customerName || form.name,
        customerPhone: wa?.customerPhone || form.phone,
        customerEmail: form.email || undefined,
        passengers: wa?.passengers || Number(form.passengers) || 1,
        passengerNames: passengerNames || undefined,
        quotedPrice: wa?.quotedPrice ?? quotedPrice,
        currency: wa?.currency || currency,
        supplierRef: wa?.supplierRef || json.supplierRef || undefined,
        supplierHeld: Boolean(json.supplierHeld),
        route: ticket ? `${ticket.from} → ${ticket.to}` : undefined,
        departureDate: ticket?.date,
        flightNumber: ticket?.flightNumber,
        airline: ticket?.airline,
        notes: passengerDetails.notes || undefined,
      });

      const whatsappUrl = whatsappLink(waMsg);
      setSuccess({
        bookingRef: ref,
        whatsappUrl,
        supplierHeld: Boolean(json.supplierHeld),
      });
      startWhatsAppCountdown(whatsappUrl);
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
          <SheetTitle className="font-heading text-2xl text-white">
            {success ? "Booking submitted" : "Review & book"}
          </SheetTitle>
          <SheetDescription>
            {success
              ? "Your request is saved. Continue on WhatsApp to complete payment and confirmation."
              : "Review the itinerary, enter traveler details, then confirm your booking."}
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-8 sm:px-8">
          {success ? (
            <BookingSuccessStep
              bookingRef={success.bookingRef}
              productTitle={productTitle}
              quotedPrice={quotedPrice}
              currency={currency}
              supplierHeld={success.supplierHeld}
              countdown={countdown}
              onMoveToWhatsApp={() => goToWhatsApp(success.whatsappUrl)}
            />
          ) : (
            <>
          {ticket ? <TicketBookingDetails ticket={ticket} /> : (
            <div className="mt-4 rounded-xl border bg-secondary/40 p-4">
              <p className="font-semibold text-navy">{productTitle}</p>
              <p className="mt-1 text-xl font-bold text-gold">
                {quotedPrice.toLocaleString()} {currency}
              </p>
            </div>
          )}

        {!authChecked ? (
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Checking account session...
          </div>
        ) : !signedIn ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-gold/30 bg-gold/10 p-5 text-sm leading-6 text-muted-foreground">
              Create an account or sign in before booking. Your passenger details, requests, and status updates will be saved in your agent portal.
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
              Open agent portal
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
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="br-name">Contact name</Label>
              <Input id="br-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="br-phone">Phone / WhatsApp</Label>
                <Input id="br-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="br-email">Email</Label>
                <Input id="br-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="br-passengers">Passengers</Label>
              <Input
                id="br-passengers"
                type="number"
                min={1}
                className="max-w-[8rem]"
                value={form.passengers}
                onChange={(e) => setPassengerCount(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-navy">Passenger details</p>
                  <p className="text-xs text-muted-foreground">
                    Enter each traveler separately, exactly as on their passport.
                  </p>
                </div>
                {form.travelers.length > 1 ? (
                  <p className="shrink-0 rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy">
                    {form.travelers.length} travelers
                  </p>
                ) : null}
              </div>

              <div className="space-y-5">
                {form.travelers.map((traveler, index) => (
                  <section
                    key={`traveler-${index}`}
                    className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_1px_0_rgba(26,39,68,0.04)]"
                  >
                    <div className="flex items-center gap-3 border-b border-navy/10 bg-gradient-to-r from-navy to-navy-light px-4 py-3 text-white">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-none">
                          Passenger {index + 1}
                          {form.travelers.length === 1 ? "" : ` of ${form.travelers.length}`}
                        </p>
                        <p className="mt-1 truncate text-xs text-white/65">
                          {[traveler.firstName, traveler.lastName].filter(Boolean).join(" ") ||
                            "Name as on passport"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 border-l-4 border-l-gold/80 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`br-first-${index}`}>First name</Label>
                          <Input
                            id={`br-first-${index}`}
                            required
                            autoComplete="given-name"
                            placeholder="Given name"
                            value={traveler.firstName}
                            onChange={(e) => updateTraveler(index, { firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`br-last-${index}`}>Last name</Label>
                          <Input
                            id={`br-last-${index}`}
                            required
                            autoComplete="family-name"
                            placeholder="Surname"
                            value={traveler.lastName}
                            onChange={(e) => updateTraveler(index, { lastName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5 sm:col-span-1">
                          <Label htmlFor={`br-passport-${index}`}>Passport number</Label>
                          <Input
                            id={`br-passport-${index}`}
                            required
                            placeholder="Passport no."
                            value={traveler.passportNo}
                            onChange={(e) => updateTraveler(index, { passportNo: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`br-dob-${index}`}>Date of birth</Label>
                          <Input
                            id={`br-dob-${index}`}
                            type="date"
                            required
                            value={traveler.dob}
                            onChange={(e) => updateTraveler(index, { dob: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`br-nationality-${index}`}>Nationality</Label>
                          <Input
                            id={`br-nationality-${index}`}
                            required
                            maxLength={2}
                            placeholder="PK"
                            value={traveler.nationality}
                            onChange={(e) =>
                              updateTraveler(index, { nationality: e.target.value.toUpperCase() })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`br-notes-${index}`}>
                          Notes for passenger {index + 1}{" "}
                          <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Textarea
                          id={`br-notes-${index}`}
                          rows={2}
                          placeholder="Special request, meal preference, assistant needed…"
                          value={traveler.notes}
                          onChange={(e) => updateTraveler(index, { notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
            {error && (
              <p className="rounded-md border border-red-accent/30 bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-navy text-white hover:bg-navy-light">
              {loading ? "Confirming booking..." : "Book Now"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              After you confirm, we will show the next payment steps and open WhatsApp with your booking details.
            </p>
          </form>
        )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BookingSuccessStep({
  bookingRef,
  productTitle,
  quotedPrice,
  currency,
  supplierHeld,
  countdown,
  onMoveToWhatsApp,
}: {
  bookingRef: string;
  productTitle: string;
  quotedPrice: number;
  currency: string;
  supplierHeld: boolean;
  countdown: number;
  onMoveToWhatsApp: () => void;
}) {
  const progress = ((WHATSAPP_REDIRECT_SECONDS - countdown) / WHATSAPP_REDIRECT_SECONDS) * 100;

  return (
    <div className="mx-auto mt-8 max-w-xl space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a66d2f]">Request received</p>
        <h3 className="mt-2 font-heading text-3xl font-bold text-navy">Booking submitted successfully</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your booking is saved
          {bookingRef ? (
            <>
              {" "}
              with reference <span className="font-semibold text-navy">{bookingRef.slice(0, 8).toUpperCase()}</span>
            </>
          ) : null}
          . Complete payment on WhatsApp so our team can confirm your seats.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/30 p-5 text-left text-sm">
        <p className="font-semibold text-navy">{productTitle}</p>
        <p className="mt-1 text-lg font-bold text-gold">
          {currency} {quotedPrice.toLocaleString("en-PK")}
        </p>
        <ul className="mt-4 space-y-3 text-muted-foreground">
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {supplierHeld
              ? "Seats are held with the supplier while you complete payment."
              : "Our team will secure seats and confirm availability after payment."}
          </li>
          <li className="flex gap-2">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" />
            Continue on WhatsApp with your booking details pre-filled for payment confirmation.
          </li>
          <li className="flex gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            {PAYMENT.instructions}
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-navy transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Opening WhatsApp in <span className="font-semibold text-navy">{countdown}s</span>…
        </p>
        <Button
          type="button"
          onClick={onMoveToWhatsApp}
          className="h-12 w-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#1ebe57]"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Move to WhatsApp
        </Button>
        <p className="text-xs text-muted-foreground">
          Prefer not to wait? Tap the button above to continue immediately.
        </p>
      </div>
    </div>
  );
}

function TicketBookingDetails({ ticket }: { ticket: Ticket }) {
  const segments = ticket.segments?.length ? ticket.segments : [];
  const airlineName = resolveAirlineName(ticket.airlineCode, ticket.airline);
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-5 bg-gradient-to-r from-navy to-navy-light p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><AirlineLogo code={ticket.airlineCode} name={airlineName} size="md" /><div><p className="text-xs font-bold uppercase tracking-[.16em] text-gold-light">Operated by</p><h3 className="mt-1 text-xl font-bold">{airlineName}</h3><p className="text-sm text-white/60">{ticket.flightNumber} · {ticket.sector}</p></div></div>
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
