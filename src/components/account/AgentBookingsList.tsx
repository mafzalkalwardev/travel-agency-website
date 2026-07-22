"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomerBookingCard } from "@/components/account/CustomerBookingCard";
import type { Booking, BookingStatus } from "@/types";

type FilterKey = "all" | "pending_payment" | "confirmed" | "cancelled";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_payment", label: "Pending payment" },
  { key: "confirmed", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
];

function matchesFilter(booking: Booking, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "confirmed") {
    return booking.status === "confirmed" || booking.status === "payment_confirmed";
  }
  return booking.status === (filter as BookingStatus);
}

interface AgentBookingsListProps {
  bookings: Booking[];
}

export function AgentBookingsList({ bookings }: AgentBookingsListProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => bookings.filter((booking) => matchesFilter(booking, filter)),
    [bookings, filter]
  );

  if (bookings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
        No booking requests yet. Browse live inventory to place your first hold.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.key}
            type="button"
            size="sm"
            variant={filter === item.key ? "navy" : "outline"}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
            {item.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({bookings.filter((b) => matchesFilter(b, item.key)).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
          No bookings in this status.
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <CustomerBookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
