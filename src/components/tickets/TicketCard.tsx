"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, ChevronDown, CircleCheck, Clock3, Plane, Users, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { AirlineLogo } from "@/components/shared/AirlineLogo";
import { BookRequestSheet } from "@/components/booking/BookRequestSheet";
import { formatTicketDate } from "@/lib/ticket-filters";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

interface TicketCardProps {
  ticket: Ticket;
  compact?: boolean;
  sourcePage?: string;
}

// Pill conventions matched to TravelLine's own status badges (see
// discovery-output/ui-reference/04-my-bookings.png: CONFIRMED/RESERVED/CANCELLED
// as bold, uppercase, rounded-full pills). "Cancelled" gets its own distinct
// red treatment, separate from "sold_out", per the redesign brief.
const statusConfig = {
  available: { label: "Available", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  limited: { label: "Limited Seats", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  sold_out: { label: "Sold Out", className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600 ring-1 ring-red-200" },
};

function seatsColor(seats: number) {
  if (seats === 0) return "text-brand-red";
  if (seats <= 5) return "text-amber-600";
  return "text-green-600";
}

/** "LHE-MCT-JED" → "1 Stop"; falls back to isDirect flag. */
function stopsLabel(ticket: Ticket): string {
  const parts = (ticket.sector || "").split("-").filter(Boolean);
  const stops = parts.length >= 2 ? parts.length - 2 : ticket.isDirect === false ? 1 : 0;
  if (stops <= 0) return "Direct";
  if (stops === 1) return "1 Stop";
  return `${stops} Stops`;
}

export function TicketCard({ ticket, compact = false, sourcePage = "/available-tickets/" }: TicketCardProps) {
  const [bookOpen, setBookOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const status = statusConfig[ticket.status];
  const isCancelled = ticket.status === "cancelled";
  const isSoldOut = ticket.status === "sold_out";
  const soldOut = isSoldOut || isCancelled;
  const productTitle = `${ticket.airline} ${ticket.flightNumber} — ${ticket.fromCity} → ${ticket.toCity} (${ticket.date})`;
  const dateLabel = formatTicketDate(ticket.date);
  const stops = stopsLabel(ticket);

  return (
    <>
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md",
          isCancelled && "border-red-100 bg-red-50/40",
          compact && "text-sm"
        )}
      >
        {/* Status pill — always visible (matches TravelLine's own booking-table
            convention of a permanent, bold status badge, not a hover/desktop-only
            treatment) so a cancelled ticket is unambiguous at a glance. */}
        <div className="mb-3 flex justify-end">
          <Badge className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase", status.className)}>
            {status.label}
          </Badge>
        </div>
        <div className={cn("flex flex-col gap-4", !compact && "lg:flex-row lg:items-center lg:justify-between")}>
          {/* Airline + route */}
          <div className={cn("flex items-start justify-between gap-4", !compact && "lg:w-56 lg:justify-start")}>
            <div className="flex items-start gap-3">
              <AirlineLogo code={ticket.airlineCode} name={ticket.airline} size={compact ? "sm" : "md"} />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {ticket.fromCity} to {ticket.toCity}
                </h3>
                <p className="text-xs text-gray-500">{ticket.sector}</p>
                <p className="text-xs text-gray-500">
                  {ticket.airline} · {ticket.flightNumber}
                </p>
              </div>
            </div>
            <p className={cn("text-right text-lg font-bold text-green-700", !compact && "lg:hidden")}>
              {ticket.price > 0
                ? `${ticket.currency} ${ticket.price.toLocaleString("en-PK")}`
                : "Contact for price"}
            </p>
          </div>

          {/* Times + duration */}
          <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 lg:px-2">
            <div className="text-center">
              <p className={cn("font-bold text-gray-900", compact ? "text-lg" : "text-xl")}>
                {ticket.departureTime || "—"}
              </p>
              <p className="text-xs text-gray-500">{dateLabel}</p>
              <p className="text-xs text-gray-600">{ticket.fromCity}</p>
            </div>
            <div className="flex flex-col items-center px-2">
              <p className="text-xs text-gray-500">{ticket.duration || ""}</p>
              <div className="my-1 h-px w-full min-w-16 bg-gray-300" />
              <p className="text-xs font-medium text-gray-700">{stops}</p>
            </div>
            <div className="text-center">
              <p className={cn("font-bold text-gray-900", compact ? "text-lg" : "text-xl")}>
                {ticket.arrivalTime || "—"}
              </p>
              <p className="text-xs text-gray-500">{ticket.to}</p>
              <p className="text-xs text-gray-600">{ticket.toCity}</p>
            </div>
          </div>

          {/* Baggage, meal, price, CTA */}
          <div className={cn("flex flex-wrap items-center justify-between gap-3", !compact && "lg:flex-nowrap lg:justify-end lg:gap-4")}>
            <div className="flex flex-col gap-1 text-xs text-gray-600">
              {ticket.baggage && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" /> {ticket.baggage}
                </span>
              )}
              <span className="flex items-center gap-1">
                <UtensilsCrossed className="h-3.5 w-3.5 text-gray-400" /> {ticket.meal || "—"}
              </span>
              <span className={cn("flex items-center gap-1 font-medium", seatsColor(ticket.seatsLeft))}>
                <Users className="h-3.5 w-3.5" /> {ticket.seatsLeft} seats
              </span>
            </div>
            <div className={cn("hidden rounded-md bg-green-50 px-3 py-2 text-center", !compact && "lg:block")}>
              {ticket.price > 0 ? (
                <>
                  <p className="text-lg font-bold text-green-800">
                    <AnimatedNumber value={ticket.price} prefix={`${ticket.currency} `} />
                  </p>
                  <p className="text-[10px] text-green-700">per person</p>
                </>
              ) : (
                <p className="text-sm font-medium text-slate-600">Contact for price</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!soldOut ? (
                <button
                  type="button"
                  onClick={() => setBookOpen(true)}
                  className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Hold &amp; Book
                </button>
              ) : isCancelled ? (
                <span className="rounded-md bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-500 ring-1 ring-red-200">
                  Cancelled
                </span>
              ) : (
                <span className="rounded-md bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-500">
                  Sold Out
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 border-t border-gray-200 pt-3">
          <button
            type="button"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-sm font-semibold text-gray-900 transition-colors hover:text-blue-600"
          >
            <span className="flex items-center gap-2"><Plane className="h-4 w-4 text-blue-600" /> Full flight details</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", detailsOpen && "rotate-180")} />
          </button>
          {detailsOpen && (
            <div className="mt-4 space-y-4 rounded-lg bg-gray-50 p-4">
              {(ticket.segments?.length ? ticket.segments : []).map((segment, index) => (
                <div key={`${segment.flightNumber}-${index}`} className="relative grid gap-4 border-l-2 border-blue-200 pl-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-blue-500 bg-white" />
                  <div>
                    <p className="font-bold text-gray-900">{formatSegmentDate(segment.departureDatetime)} · {formatSegmentTime(segment.departureDatetime)}</p>
                    <p className="text-sm font-semibold text-gray-800">{segment.departureCity} ({segment.departureCode})</p>
                    <p className="text-xs text-gray-500">{segment.departureAirport}{segment.departureTerminal ? ` · Terminal ${segment.departureTerminal}` : ""}</p>
                  </div>
                  <div className="min-w-36 rounded-md border border-gray-200 bg-white px-3 py-2 text-center text-xs text-gray-500">
                    <p className="font-semibold text-gray-900">{segment.airline} {segment.flightNumber}</p>
                    <p>{segment.aircraft || "Aircraft TBA"}</p>
                    <p>{segment.meal === "Yes" ? "Meal included" : segment.meal || "Meal not specified"}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="font-bold text-gray-900">{formatSegmentDate(segment.arrivalDatetime)} · {formatSegmentTime(segment.arrivalDatetime)}</p>
                    <p className="text-sm font-semibold text-gray-800">{segment.arrivalCity} ({segment.arrivalCode})</p>
                    <p className="text-xs text-gray-500">{segment.arrivalAirport}{segment.arrivalTerminal ? ` · Terminal ${segment.arrivalTerminal}` : ""}</p>
                  </div>
                </div>
              ))}
              <div className="grid gap-2 border-t border-gray-200 pt-3 text-xs text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
                <span className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-gray-400" /> Baggage: {ticket.baggage || "Not specified"}</span>
                <span className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-gray-400" /> Refundable: {humanizeRule(ticket.refundable)}</span>
                <span className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-gray-400" /> Change fee: {humanizeRule(ticket.changeFeeApplicable)}</span>
                <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-gray-400" /> Live seats: {ticket.seatsLeft}</span>
              </div>
              {ticket.supplierUpdatedAt && <p className="text-[11px] text-gray-500">Supplier updated {new Date(ticket.supplierUpdatedAt).toLocaleString("en-PK")}</p>}
            </div>
          )}
        </div>
      </motion.article>

      <BookRequestSheet
        open={bookOpen}
        onOpenChange={setBookOpen}
        productType="ticket"
        productTitle={productTitle}
        quotedPrice={ticket.price}
        currency={ticket.currency}
        ticketId={ticket.id}
        sourcePage={sourcePage}
        ticket={ticket}
      />
    </>
  );
}

function formatSegmentTime(value: string) {
  if (!value) return "—";
  return value.slice(11, 16) || "—";
}

function formatSegmentDate(value: string) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toLocaleDateString("en-PK", { day: "2-digit", month: "short" });
}

function humanizeRule(value?: string) {
  if (!value) return "Not specified";
  return value.toLowerCase() === "yes" ? "Yes" : value.toLowerCase() === "no" ? "No" : value;
}
