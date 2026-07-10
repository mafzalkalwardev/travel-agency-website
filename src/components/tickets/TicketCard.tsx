"use client";

import { useState } from "react";
import { ChevronDown, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AirlineLogo } from "@/components/shared/AirlineLogo";
import { BookRequestSheet } from "@/components/booking/BookRequestSheet";
import { formatPrice, formatTicketDate } from "@/lib/ticket-filters";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

interface TicketCardProps {
  ticket: Ticket;
  compact?: boolean;
}

const statusConfig = {
  available: { label: "Available", className: "bg-green-50 text-green-700" },
  limited: { label: "Limited", className: "bg-amber-50 text-amber-700" },
  sold_out: { label: "Sold Out", className: "bg-red-50 text-brand-red" },
};

export function TicketCard({ ticket, compact = false }: TicketCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const status = statusConfig[ticket.status];
  const productTitle = `${ticket.airline} ${ticket.flightNumber} — ${ticket.fromCity} → ${ticket.toCity} (${ticket.date})`;
  const dateLabel = formatTicketDate(ticket.date);

  return (
    <>
      <Card className="overflow-hidden border-border/60 transition-colors hover:border-gold/30">
        <CardContent className={cn("p-4", compact && "p-3.5")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <AirlineLogo code={ticket.airlineCode} name={ticket.airline} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-navy">{ticket.from}</span>
                  <Plane className="h-3.5 w-3.5 shrink-0 text-gold" />
                  <span className="font-semibold text-navy">{ticket.to}</span>
                  <Badge className={cn("text-[10px]", status.className)}>{status.label}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {ticket.airline} · {dateLabel} · {ticket.seatsLeft} seats
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
              <p className="text-lg font-bold text-gold">{formatPrice(ticket.price, ticket.currency)}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setExpanded(!expanded)}>
                  Details
                  <ChevronDown className={cn("ml-0.5 h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
                </Button>
                {ticket.status !== "sold_out" ? (
                  <Button
                    size="sm"
                    className="h-8 bg-gold px-3 text-xs font-semibold text-navy hover:bg-gold-light"
                    onClick={() => setBookOpen(true)}
                  >
                    Book
                  </Button>
                ) : (
                  <Button size="sm" disabled className="h-8 px-3 text-xs">
                    Sold Out
                  </Button>
                )}
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
              <p>{ticket.fromCity} → {ticket.toCity} · {ticket.flightNumber} · {ticket.sector}</p>
              {(ticket.departureTime || ticket.arrivalTime) && (
                <p className="mt-1">{ticket.departureTime} – {ticket.arrivalTime} · {ticket.duration || "Direct"}</p>
              )}
              {ticket.baggage && <p className="mt-1">Baggage: {ticket.baggage}</p>}
              {ticket.notes && <p className="mt-1">{ticket.notes}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <BookRequestSheet
        open={bookOpen}
        onOpenChange={setBookOpen}
        productType="ticket"
        productTitle={productTitle}
        quotedPrice={ticket.price}
        currency={ticket.currency}
        ticketId={ticket.id}
        sourcePage="/available-tickets/"
      />
    </>
  );
}
