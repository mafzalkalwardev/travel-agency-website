"use client";

import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  MessageCircle,
  Plane,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AirlineLogo } from "@/components/shared/AirlineLogo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { buildBookingWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus, Ticket } from "@/types";

const statusCopy: Record<BookingStatus, { label: string; className: string }> = {
  pending_payment: { label: "Awaiting payment", className: "bg-amber-100 text-amber-800" },
  payment_confirmed: { label: "Payment received", className: "bg-blue-100 text-blue-800" },
  booking_in_progress: { label: "Processing", className: "bg-purple-100 text-purple-800" },
  confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-800" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
};

const holdCopy: Record<string, { label: string; className: string }> = {
  held: { label: "Seat held at supplier", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  failed: { label: "Supplier hold pending admin retry", className: "bg-red-50 text-red-700 ring-1 ring-red-200" },
  pending: { label: "Requesting supplier hold...", className: "bg-purple-50 text-purple-700 ring-1 ring-purple-200" },
};

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function BookingConfirmation({ booking, ticket }: { booking: Booking; ticket: Ticket | null }) {
  const status = statusCopy[booking.status] || statusCopy.pending_payment;
  const hold = booking.supplier_hold_status ? holdCopy[booking.supplier_hold_status] : null;
  // TravelLine's own order id (e.g. "TL-CF27B1") — createBooking() already
  // prioritizes orderId over the airline PNR when storing this field. This
  // is deliberately the *same* identifier a sub-agent would see on
  // TravelLine's own confirmation, per docs/REDESIGN.md §8.2/§3.7.
  const orderId = booking.travelline_order_id || booking.travelline_booking_ref;
  const isConfirmed = booking.status === "confirmed" || booking.travelline_status === "CONFIRMED";
  const canPay =
    booking.status === "pending_payment" || booking.status === "payment_confirmed";
  const passengerNames =
    booking.passenger_details &&
    typeof booking.passenger_details === "object" &&
    "names" in booking.passenger_details
      ? String((booking.passenger_details as { names?: unknown }).names || "")
      : "";

  const waMessage = buildBookingWhatsAppMessage({
    bookingRef: booking.id,
    productTitle: booking.product_title || booking.product_type,
    customerName: booking.customer_name,
    customerPhone: booking.customer_phone,
    customerEmail: booking.customer_email || undefined,
    passengers: booking.passengers,
    passengerNames: passengerNames || undefined,
    quotedPrice: Number(booking.quoted_price),
    currency: booking.currency,
    supplierRef: orderId || undefined,
    supplierHeld: booking.supplier_hold_status === "held",
    route: ticket ? `${ticket.from} → ${ticket.to}` : undefined,
    departureDate: ticket?.date,
    flightNumber: ticket?.flightNumber,
    airline: ticket?.airline,
  });

  const segments = ticket?.segments?.length
    ? ticket.segments
    : ticket
      ? [
          {
            flightNumber: ticket.flightNumber,
            airline: ticket.airline,
            airlineCode: ticket.airlineCode,
            departureAirport: ticket.fromCity,
            departureCode: ticket.from,
            departureCity: ticket.fromCity,
            departureDatetime: `${ticket.date}T${ticket.departureTime || "00:00"}`,
            arrivalAirport: ticket.toCity,
            arrivalCode: ticket.to,
            arrivalCity: ticket.toCity,
            arrivalDatetime: `${ticket.date}T${ticket.arrivalTime || "00:00"}`,
          },
        ]
      : [];

  return (
    <section className="section-padding bg-slate-50 print:bg-white">
      <div className="container-wide max-w-4xl">
        <div className="mb-6 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.14em] text-royal">
              {isConfirmed ? "E-ticket / voucher" : "Booking confirmation"}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-navy sm:text-3xl">
              {booking.product_title || "Your booking"}
            </h1>
            {isConfirmed && (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Your booking is confirmed. Save or print this page as your travel voucher — quote the order ID below to our team.
              </p>
            )}
          </div>
          <Link href="/account/" className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>
            Back to agent portal
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm print:border-0 print:shadow-none">
          <div className="flex flex-col gap-5 bg-gradient-to-r from-navy to-navy-light p-6 text-white sm:flex-row sm:items-center sm:justify-between print:bg-navy print:text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-gold-light">Order ID</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wide">
                {orderId || `AQ-${booking.id.slice(0, 8).toUpperCase()}`}
              </p>
              <p className="mt-1 text-xs text-white/60">
                Same reference as shown on the supplier&apos;s own confirmation — quote this to our team any time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              <Badge className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide", status.className)}>
                {status.label}
              </Badge>
              {hold && (
                <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium", hold.className)}>
                  {hold.label}
                </Badge>
              )}
            </div>
          </div>

          {ticket ? (
            <div className="grid gap-5 p-6 lg:grid-cols-[1fr_230px]">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <AirlineLogo code={ticket.airlineCode} name={ticket.airline} size="md" />
                  <div>
                    <p className="font-semibold text-navy">{ticket.airline}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.flightNumber} · {ticket.sector}
                    </p>
                  </div>
                </div>
                {segments.map((segment, index) => (
                  <div
                    key={`${segment.flightNumber}-${index}`}
                    className="relative grid gap-4 rounded-xl border bg-slate-50 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center print:border-slate-300"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Departure</p>
                      <p className="mt-1 text-2xl font-bold text-navy">{segment.departureCode}</p>
                      <p className="text-sm">{segment.departureCity}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(segment.departureDatetime)}</p>
                    </div>
                    <div className="flex min-w-28 flex-col items-center">
                      <Plane className="h-5 w-5 text-gold" />
                      <div className="my-2 h-px w-full bg-gold/40" />
                      <p className="text-xs font-semibold text-navy">{segment.flightNumber}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Arrival</p>
                      <p className="mt-1 text-2xl font-bold text-navy">{segment.arrivalCode}</p>
                      <p className="text-sm">{segment.arrivalCity}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(segment.arrivalDatetime)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <aside className="rounded-xl border bg-secondary/40 p-4 text-sm print:border-slate-300">
                <p className="font-bold text-navy">Booking details</p>
                <ul className="mt-4 space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gold" />
                    {new Date(`${ticket.date}T00:00:00`).toLocaleDateString("en-PK", { dateStyle: "medium" })}
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-gold" />
                    {ticket.duration || "Duration TBA"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gold" />
                    {ticket.baggage || "Baggage TBA"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gold" />
                    {booking.passengers} passenger{booking.passengers === 1 ? "" : "s"}
                  </li>
                </ul>
                <div className="mt-5 border-t pt-4">
                  <p className="text-xs uppercase tracking-[.14em] text-muted-foreground">Total fare</p>
                  <p className="mt-1 text-xl font-bold text-navy">
                    {booking.currency} {Number(booking.quoted_price).toLocaleString("en-PK")}
                  </p>
                </div>
              </aside>
            </div>
          ) : (
            <div className="p-6">
              <p className="font-semibold text-navy">{booking.product_title || booking.product_type}</p>
              <p className="mt-1 text-xl font-bold text-gold">
                {booking.currency} {Number(booking.quoted_price).toLocaleString("en-PK")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {booking.passengers} passenger{booking.passengers === 1 ? "" : "s"}
              </p>
            </div>
          )}

          <div className="border-t bg-slate-50/60 p-6">
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p>
                <strong className="text-slate-900">Booked by:</strong> {booking.customer_name}
              </p>
              <p>
                <strong className="text-slate-900">Phone:</strong> {booking.customer_phone}
              </p>
              {booking.customer_email && (
                <p>
                  <strong className="text-slate-900">Email:</strong> {booking.customer_email}
                </p>
              )}
              {passengerNames && (
                <p className="sm:col-span-2">
                  <strong className="text-slate-900">Passengers:</strong> {passengerNames}
                </p>
              )}
              <p>
                <strong className="text-slate-900">Submitted:</strong>{" "}
                {new Date(booking.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
              </p>
              {(booking.travelline_confirmed_at || isConfirmed) && (
                <p>
                  <strong className="text-slate-900">Confirmed:</strong>{" "}
                  {booking.travelline_confirmed_at
                    ? new Date(booking.travelline_confirmed_at).toLocaleString("en-PK", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Yes"}
                </p>
              )}
              {booking.travelline_status && (
                <p>
                  <strong className="text-slate-900">Status:</strong> {booking.travelline_status}
                </p>
              )}
            </div>

            {(booking.supplier_hold_error || booking.error_message) && (
              <p className="mt-4 rounded-md bg-red-accent/10 px-3 py-2 text-sm text-red-accent print:hidden">
                {booking.supplier_hold_error || booking.error_message}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-3 print:hidden sm:flex-row">
              {canPay && (
                <a
                  href={whatsappLink(waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "primaryGold" }), "flex-1")}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {booking.status === "pending_payment" ? "Complete payment on WhatsApp" : "Message us on WhatsApp"}
                </a>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className={cn(
                  buttonVariants({ variant: isConfirmed ? "primaryGold" : "outline" }),
                  "flex-1"
                )}
              >
                <Download className="mr-2 h-4 w-4" />
                {isConfirmed ? "Print / save voucher" : "Download / print"}
              </button>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground print:hidden">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {isConfirmed
                ? "This voucher is your booking confirmation. Bring a copy when traveling and keep the order ID handy."
                : "Seats are held after you book. Once payment is confirmed, this page becomes your printable voucher."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground print:hidden">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Need help? Message us any time on WhatsApp.
        </div>
      </div>
    </section>
  );
}
