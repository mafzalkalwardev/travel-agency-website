"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { UmrahPackageListCard } from "@/components/packages/UmrahPackageListCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { TravelPackage, UmrahPackageFilters } from "@/types";

function filterPackages(packages: TravelPackage[], filters: UmrahPackageFilters): TravelPackage[] {
  let result = packages.filter((pkg) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [
        pkg.title,
        pkg.airline,
        pkg.departureCity,
        pkg.hotelMakkah,
        pkg.hotelMadinah,
        pkg.flightNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.departureCity && pkg.departureCity !== filters.departureCity) return false;
    if (filters.airline && pkg.airline !== filters.airline) return false;
    if (filters.duration && pkg.duration !== filters.duration) return false;
    if (filters.hotelStars && (pkg.hotelStars || 0) < filters.hotelStars) return false;
    return true;
  });

  if (filters.sortBy === "price") {
    result = [...result].sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === "seats") {
    result = [...result].sort((a, b) => (b.seatsLeft || 0) - (a.seatsLeft || 0));
  } else {
    result = [...result].sort((a, b) => {
      const ad = a.departureDate || "";
      const bd = b.departureDate || "";
      return ad.localeCompare(bd) || a.price - b.price;
    });
  }

  return result;
}

function getPackageFilterOptions(packages: TravelPackage[]) {
  return {
    departures: [...new Set(packages.map((p) => p.departureCity).filter(Boolean))].sort() as string[],
    airlines: [...new Set(packages.map((p) => p.airline).filter(Boolean))].sort() as string[],
    durations: [...new Set(packages.map((p) => p.duration).filter(Boolean))].sort() as string[],
    starRatings: [...new Set(packages.map((p) => p.hotelStars).filter(Boolean))].sort(
      (a, b) => (a as number) - (b as number)
    ) as number[],
  };
}

interface UmrahPackagesPageClientProps {
  packages: TravelPackage[];
}

export function UmrahPackagesPageClient({ packages }: UmrahPackagesPageClientProps) {
  const [filters, setFilters] = useState<UmrahPackageFilters>({ sortBy: "date" });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const options = useMemo(() => getPackageFilterOptions(packages), [packages]);
  const filtered = useMemo(() => filterPackages(packages, filters), [packages, filters]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function updateFilters(next: UmrahPackageFilters) {
    setFilters(next);
  }

  const filterControls = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2">
        <Label>Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by package title, hotel, airline..."
            value={filters.search || ""}
            onChange={(e) => updateFilters({ ...filters, search: e.target.value || undefined })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Departure</Label>
        <Select
          value={filters.departureCity || "all"}
          onValueChange={(v) => updateFilters({ ...filters, departureCity: !v || v === "all" ? undefined : v })}
        >
          <SelectTrigger><SelectValue placeholder="Any Departure" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Departure</SelectItem>
            {options.departures.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Airline</Label>
        <Select
          value={filters.airline || "all"}
          onValueChange={(v) => updateFilters({ ...filters, airline: !v || v === "all" ? undefined : v })}
        >
          <SelectTrigger><SelectValue placeholder="Any Airline" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Airline</SelectItem>
            {options.airlines.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Duration</Label>
        <Select
          value={filters.duration || "all"}
          onValueChange={(v) => updateFilters({ ...filters, duration: !v || v === "all" ? undefined : v })}
        >
          <SelectTrigger><SelectValue placeholder="Any Duration" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Duration</SelectItem>
            {options.durations.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" /> Star Rating
        </Label>
        <Select
          value={filters.hotelStars ? String(filters.hotelStars) : "all"}
          onValueChange={(v) =>
            updateFilters({ ...filters, hotelStars: v === "all" ? undefined : Number(v) })
          }
        >
          <SelectTrigger><SelectValue placeholder="Any Star Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Star Rating</SelectItem>
            {options.starRatings.map((s) => (
              <SelectItem key={s} value={String(s)}>{s} stars & up</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="hidden lg:block">{filterControls}</div>

      <div className="flex items-center justify-between lg:hidden">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm">
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
              <SheetTitle className="font-heading text-navy">Filter Packages</SheetTitle>
            </SheetHeader>
            <div className="mt-4 pb-6">{filterControls}</div>
          </SheetContent>
        </Sheet>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <strong className="text-navy">all {filtered.length}</strong> packages
        <span className="text-muted-foreground/80"> · Sorted by earliest departure</span>
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No packages match your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((pkg) => (
            <div key={pkg.id} className="inventory-card-shell">
              <UmrahPackageListCard pkg={pkg} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
