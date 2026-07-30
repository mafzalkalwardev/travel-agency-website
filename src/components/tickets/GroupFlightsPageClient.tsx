"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { TicketCard } from "@/components/tickets/TicketCard";
import { TicketFiltersPanel } from "@/components/tickets/TicketFiltersPanel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { filterTickets, getUniqueFilterOptions } from "@/lib/ticket-filters";
import {
  EXPLORE_CATEGORIES,
  exploreCategoryHref,
  getExploreCategory,
} from "@/lib/travelline/categories";
import { airlines } from "@/data/airlines";
import type { Ticket, TicketFilters } from "@/types";

const airlineNames = Object.fromEntries(airlines.map((a) => [a.code, a.name]));
interface GroupFlightsPageClientProps {
  tickets: Ticket[];
  categorySlug: string;
}

export function GroupFlightsPageClient({ tickets, categorySlug }: GroupFlightsPageClientProps) {
  const router = useRouter();
  const category = getExploreCategory(categorySlug);
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TicketFilters>({
    groupCategory: category?.apiCategory ?? undefined,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const initial: TicketFilters = {
      groupCategory: category?.apiCategory ?? undefined,
    };
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
    setVisibleCount(20);
  }, [searchParams, category?.apiCategory]);

  const options = useMemo(() => getUniqueFilterOptions(tickets), [tickets]);
  const filtered = useMemo(() => filterTickets(tickets, filters), [tickets, filters]);
  const visible = filtered.slice(0, visibleCount);
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== "groupCategory"
  ).length;

  const groupCategories = EXPLORE_CATEGORIES.filter((c) => c.kind === "group-flights");

  function updateFilters(next: TicketFilters) {
    setFilters({ ...next, groupCategory: category?.apiCategory ?? undefined });
    setVisibleCount(20);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing flights for:{" "}
          <strong className="text-navy">{category?.label || "Group Flights"}</strong>
        </p>
        <Select
          value={categorySlug}
          onValueChange={(slug) => slug && router.push(exploreCategoryHref(getExploreCategory(slug)!))}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Change category">
              {category?.label ?? categorySlug}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EXPLORE_CATEGORIES.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <TicketFiltersPanel
            filters={filters}
            onChange={updateFilters}
            options={options}
            airlineNames={airlineNames}
            hideDestination
          />
        </aside>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <strong className="text-navy">{visible.length}</strong> of{" "}
              <strong className="text-navy">{filtered.length}</strong> flights
              <span className="text-muted-foreground/80"> · Sorted by earliest departure</span>
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
                  <SheetTitle className="font-heading text-navy">Filter Flights</SheetTitle>
                </SheetHeader>
                <div className="mt-4 pb-6">
                  <TicketFiltersPanel
                    filters={filters}
                    onChange={updateFilters}
                    options={options}
                    airlineNames={airlineNames}
                    hideDestination
                  />
                  <Button
                    className="mt-4 w-full bg-navy text-white hover:bg-navy-light"
                    onClick={() => setFiltersOpen(false)}
                  >
                    Show {filtered.length} flights
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center sm:p-12">
              <p className="text-muted-foreground">
                {tickets.length === 0
                  ? "Travel Line currently has no live groups in this category. Check back shortly or try another destination."
                  : "No flights match your filters right now. Try clearing filters or choose another category."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {groupCategories.map((item) => (
                  <Link
                    key={item.slug}
                    href={exploreCategoryHref(item)}
                    className="inline-flex h-8 items-center rounded-lg border border-input bg-background px-3 text-sm hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {visible.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="inventory-card-shell"
                  >
                    <TicketCard ticket={ticket} sourcePage={`/group-flights/${categorySlug}/`} />
                  </div>
                ))}
              </div>
              {visibleCount < filtered.length && (
                <div className="flex justify-center pt-2">
                  <Button type="button" variant="outline" onClick={() => setVisibleCount((n) => n + 20)}>
                    Load more flights
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
