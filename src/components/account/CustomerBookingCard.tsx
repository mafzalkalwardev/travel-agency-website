"use client";

import Link from "next/link";
import { Download, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { buildBookingWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/types";

const statusColors: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_confirmed: "bg-blue-100 text-blue-800",
  booking_in_progress: "bg-purple-100 text-purple-800",
  confirmed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const holdColors: Record<string, string> = {
  held: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  pending: "bg-purple-100 text-purple-800",
};

function formatPassengerDetails(details: Record<string, unknown> | null | undefined) {
  if (!details) return null;
  const names = details.names ? String(details.names) : null;
  const notes = details.notes ? String(details.notes) : null;
  if (!names && !notes) return null;
  return { names, notes };
}

export function CustomerBookingCard({ booking }: { booking: Booking }) {
  const ref = booking.id.slice(0, 8).toUpperCase();
  const passengers = formatPassengerDetails(
    booking.passenger_details as Record<string, unknown> | undefined
  );
  const canPay =
    booking.status === "pending_payment" || booking.status === "payment_confirmed";
  const isConfirmed =
    booking.status === "confirmed" || booking.travelline_status === "CONFIRMED";
  const ticketUrl = `/account/bookings/${booking.id}/`;

  const payUrl = canPay
    ? whatsappLink(
        buildBookingWhatsAppMessage({
          bookingRef: booking.id,
          productTitle: booking.product_title || booking.product_type,
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          customerEmail: booking.customer_email || undefined,
          passengers: booking.passengers,
          passengerNames: passengers?.names || undefined,
          quotedPrice: Number(booking.quoted_price),
          currency: booking.currency,
          supplierRef: booking.travelline_order_id || booking.travelline_booking_ref || undefined,
          supplierHeld: booking.supplier_hold_status === "held",
          notes: passengers?.notes || undefined,
        })
      )
    : null;

  return (
    <article className="rounded-xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-navy">
            {booking.product_title || booking.product_type}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Ref {ref} · {new Date(booking.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={statusColors[booking.status]}>
            {booking.status.replace(/_/g, " ")}
          </Badge>
          {booking.travelline_status && (
            <Badge className="bg-slate-100 text-slate-800">{booking.travelline_status}</Badge>
          )}
          {booking.supplier_hold_status && (
            <Badge className={holdColors[booking.supplier_hold_status] || "bg-gray-100"}>
              hold: {booking.supplier_hold_status}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
        <p>
          <strong className="text-slate-900">Passengers:</strong> {booking.passengers}
        </p>
        <p>
          <strong className="text-slate-900">Price:</strong>{" "}
          {Number(booking.quoted_price).toLocaleString()} {booking.currency}
        </p>
        <p>
          <strong className="text-slate-900">Phone:</strong> {booking.customer_phone}
        </p>
        <p>
          <strong className="text-slate-900">Type:</strong> {booking.product_type}
        </p>
      </div>

      {(booking.travelline_order_id || booking.travelline_booking_ref) && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <strong>Booking ref:</strong>{" "}
          {booking.travelline_order_id || booking.travelline_booking_ref}
        </p>
      )}

      {passengers && (
        <div className="mt-3 space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {passengers.names && (
            <p>
              <strong className="text-slate-900">Names:</strong> {passengers.names}
            </p>
          )}
          {passengers.notes && (
            <p>
              <strong className="text-slate-900">Notes:</strong> {passengers.notes}
            </p>
          )}
        </div>
      )}

      {(booking.supplier_hold_error || booking.error_message) && (
        <p className="mt-3 rounded-md bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
          {booking.supplier_hold_error || booking.error_message}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap">
        <Link
          href={ticketUrl}
          className={cn(
            buttonVariants({ variant: isConfirmed ? "primaryGold" : "outline", size: "default" }),
            "w-full sm:w-auto"
          )}
        >
          <Download className="mr-2 h-4 w-4" />
          {isConfirmed ? "View / print voucher" : "View booking"}
        </Link>
        {payUrl && (
          <a
            href={payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "primaryGold", size: "default" }),
              "w-full sm:w-auto"
            )}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {booking.status === "pending_payment"
              ? "Complete payment on WhatsApp"
              : "Message us on WhatsApp"}
          </a>
        )}
      </div>
    </article>
  );
}
