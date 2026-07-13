"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { TicketCard } from "@/components/tickets/TicketCard";
import { TicketFiltersPanel } from "@/components/tickets/TicketFiltersPanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { filterTickets, getUniqueFilterOptions } from "@/lib/ticket-filters";
import { airlines } from "@/data/airlines";
import type { Ticket, TicketFilters } from "@/types";

const airlineNames = Object.fromEntries(airlines.map((a) => [a.code, a.name]));
interface TicketsPageClientProps {
  tickets: Ticket[];
}

export function TicketsPageClient({ tickets }: TicketsPageClientProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TicketFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const initial: TicketFilters = {};
    const fromCity = searchParams.get("fromCity");
    const toCity = searchParams.get("toCity");
    const date = searchParams.get("date");
    if (fromCity) initial.fromCity = fromCity;
    if (toCity) initial.toCity = toCity;
    if (date) initial.date = date;
    const airline = searchParams.get("airline");
    if (airline && airline !== "All Airlines") {
      const codeMap: Record<string, string> = {
        PIA: "PK",
        Saudia: "SV",
        Emirates: "EK",
        Airblue: "PA",
        AirSial: "PF",
        "Qatar Airways": "QR",
        "Fly Jinnah": "9P",
        Flynas: "XY",
      };
      initial.airline = codeMap[airline] || airline;
    }
    setFilters(initial);
  }, [searchParams]);

  const options = useMemo(() => getUniqueFilterOptions(tickets), [tickets]);
  const filtered = useMemo(() => filterTickets(tickets, filters), [tickets, filters]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function updateFilters(next: TicketFilters) {
    setFilters(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <TicketFiltersPanel
          filters={filters}
          onChange={updateFilters}
          options={options}
          airlineNames={airlineNames}
        />
      </aside>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <strong className="text-navy">all {filtered.length}</strong> group tickets
            {filtered.length !== tickets.length && (
              <span className="text-muted-foreground/80"> (filtered from {tickets.length})</span>
            )}
          </p>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-navy">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="font-heading text-navy">Filter Tickets</SheetTitle>
              </SheetHeader>
              <div className="mt-4 pb-6">
                <TicketFiltersPanel
                  filters={filters}
                  onChange={(next) => {
                    updateFilters(next);
                  }}
                  options={options}
                  airlineNames={airlineNames}
                />
                <Button
                  className="mt-4 w-full bg-navy text-white hover:bg-navy-light"
                  onClick={() => setFiltersOpen(false)}
                >
                  Show {filtered.length} tickets
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center sm:p-12">
            <p className="font-medium text-navy">Live inventory is being updated</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We are syncing the latest group fares from our supplier. Please check back in a few
              minutes, or contact us on WhatsApp for immediate availability.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center sm:p-12">
            <p className="text-muted-foreground">
              No tickets match your filters. Try adjusting your search criteria.
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => updateFilters({})}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filtered.map((ticket) => (
                <div
                  key={ticket.id}
                  className="inventory-card-shell"
                >
                  <TicketCard ticket={ticket} />
                </div>
              ))}
            </div>

          </>
        )}
      </div>
    </div>
  );
}
