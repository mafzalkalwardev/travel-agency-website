"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Clock, Plane, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AirlineLogo } from "@/components/shared/AirlineLogo";
import { BookRequestSheet } from "@/components/booking/BookRequestSheet";
import { formatPrice } from "@/lib/ticket-filters";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

interface TicketCardProps {
  ticket: Ticket;
  compact?: boolean;
}

const statusConfig = {
  available: { label: "Available", className: "bg-green-100 text-green-800" },
  limited: { label: "Limited", className: "bg-amber-100 text-amber-800" },
  sold_out: { label: "Sold Out", className: "bg-red-100 text-brand-red" },
};

function seatsColor(seats: number) {
  if (seats === 0) return "text-brand-red";
  if (seats <= 5) return "text-amber-600";
  return "text-green-600";
}

export function TicketCard({ ticket, compact = false }: TicketCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const status = statusConfig[ticket.status];
  const productTitle = `${ticket.airline} ${ticket.flightNumber} — ${ticket.fromCity} → ${ticket.toCity} (${ticket.date})`;

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
      <Card className={cn("overflow-hidden border-border/60 transition-all hover:border-gold/30 hover:shadow-lg", compact && "text-sm")}>
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            <div className="flex items-center gap-4 border-b border-border/40 bg-secondary/30 p-4 lg:w-48 lg:border-b-0 lg:border-r">
              <AirlineLogo code={ticket.airlineCode} name={ticket.airline} size={compact ? "sm" : "md"} />
              <div className="lg:hidden">
                <p className="font-semibold text-navy">{ticket.airline}</p>
                <p className="text-xs text-muted-foreground">{ticket.flightNumber}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-2">
                <div className="hidden lg:block">
                  <p className="font-semibold text-navy">{ticket.airline}</p>
                  <p className="text-xs text-muted-foreground">{ticket.flightNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-navy">{ticket.from}</p>
                    <p className="text-[11px] text-muted-foreground">{ticket.fromCity}</p>
                    <p className="text-xs text-muted-foreground">{ticket.departureTime}</p>
                  </div>
                  <div className="flex flex-1 flex-col items-center px-2">
                    <div className="flex w-full items-center gap-1">
                      <div className="h-px flex-1 bg-border" />
                      <Plane className="h-3 w-3 text-gold" />
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {ticket.duration || "Direct"}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-navy">{ticket.to}</p>
                    <p className="text-[11px] text-muted-foreground">{ticket.toCity}</p>
                    <p className="text-xs text-muted-foreground">{ticket.arrivalTime}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{new Date(ticket.date).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                  <span>•</span>
                  <span>{ticket.sector}</span>
                  <span>•</span>
                  <span>{ticket.destination}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                <div className="text-right">
                  <p className="text-xl font-bold text-gold">{formatPrice(ticket.price, ticket.currency)}</p>
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <Badge className={status.className}>{status.label}</Badge>
                    <span className={cn("flex items-center gap-1 text-xs font-medium", seatsColor(ticket.seatsLeft))}>
                      <Users className="h-3 w-3" />
                      {ticket.seatsLeft} seats
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                    className="hidden sm:inline-flex"
                  >
                    Details
                    <ChevronDown className={cn("ml-1 h-3 w-3 transition-transform", expanded && "rotate-180")} />
                  </Button>
                  {ticket.status !== "sold_out" ? (
                    <Button
                      size="sm"
                      onClick={() => setBookOpen(true)}
                      className="bg-gold text-navy hover:bg-gold-light whitespace-nowrap"
                    >
                      Hold & Book
                    </Button>
                  ) : (
                    <Button size="sm" disabled className="whitespace-nowrap">
                      Sold Out
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {expanded && (
            <div className="border-t border-border/40 bg-secondary/20 p-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-3">
                {ticket.baggage && <p><span className="font-medium text-navy">Baggage:</span> {ticket.baggage}</p>}
                {ticket.aircraft && <p><span className="font-medium text-navy">Aircraft:</span> {ticket.aircraft}</p>}
                <p><span className="font-medium text-navy">Route:</span> {ticket.fromCity} → {ticket.toCity}</p>
              </div>
              {ticket.notes && <p className="mt-2 text-muted-foreground">{ticket.notes}</p>}
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

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
