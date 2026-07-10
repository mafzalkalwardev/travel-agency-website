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
const PAGE_SIZE = 20;

interface TicketsPageClientProps {
  tickets: Ticket[];
}

export function TicketsPageClient({ tickets }: TicketsPageClientProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TicketFilters>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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
        PIA: "PK", Saudia: "SV", Emirates: "EK", Airblue: "PA", AirSial: "PF",
        "Qatar Airways": "QR", "Fly Jinnah": "9P", Flynas: "XY",
        PK: "PK", SV: "SV", EK: "EK", PA: "PA", PF: "PF", QR: "QR", "9P": "9P", XY: "XY",
      };
      initial.airline = codeMap[airline] || airline;
    }
    setFilters(initial);
    setVisibleCount(PAGE_SIZE);
  }, [searchParams]);

  const options = useMemo(() => getUniqueFilterOptions(tickets), [tickets]);
  const filtered = useMemo(() => filterTickets(tickets, filters), [tickets, filters]);
  const visible = filtered.slice(0, visibleCount);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function updateFilters(next: TicketFilters) {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
        <TicketFiltersPanel
          filters={filters}
          onChange={updateFilters}
          options={options}
          airlineNames={airlineNames}
        />
      </aside>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
          </p>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-gold px-1.5 text-[10px] font-bold text-navy">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
              <SheetHeader>
                <SheetTitle>Filter Tickets</SheetTitle>
              </SheetHeader>
              <div className="mt-4 pb-4">
                <TicketFiltersPanel
                  filters={filters}
                  onChange={updateFilters}
                  options={options}
                  airlineNames={airlineNames}
                />
                <Button className="mt-4 w-full bg-navy text-white" onClick={() => setFiltersOpen(false)}>
                  Show {filtered.length} tickets
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No tickets match your filters.</p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => updateFilters({})}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {visible.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} compact />
              ))}
            </div>

            {visibleCount < filtered.length && (
              <div className="pt-2 text-center">
                <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Load more ({filtered.length - visibleCount})
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
