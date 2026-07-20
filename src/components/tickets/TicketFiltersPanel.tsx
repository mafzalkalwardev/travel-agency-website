"use client";

import { X } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TicketFilters } from "@/types";

interface TicketFiltersPanelProps {
  filters: TicketFilters;
  onChange: (filters: TicketFilters) => void;
  options: {
    airlines: string[];
    sectors: string[];
    fromCities: string[];
    toCities: string[];
    destinations: string[];
    dates: string[];
  };
  airlineNames: Record<string, string>;
  hideDestination?: boolean;
}

export function TicketFiltersPanel({
  filters,
  onChange,
  options,
  airlineNames,
  hideDestination = false,
}: TicketFiltersPanelProps) {
  const update = (key: keyof TicketFilters, value: string | number | null | undefined) => {
    onChange({ ...filters, [key]: !value || value === "all" ? undefined : value });
  };

  const clearFilters = () => onChange({});

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-lg text-gray-900">Filter Tickets</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-700">
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Airline</Label>
          <Select value={filters.airline || "all"} onValueChange={(v) => update("airline", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All airlines" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Airlines</SelectItem>
              {options.airlines.map((code) => (
                <SelectItem key={code} value={code}>{airlineNames[code] || code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sector</Label>
          <Select value={filters.sector || "all"} onValueChange={(v) => update("sector", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All sectors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {options.sectors.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>From City</Label>
          <Select value={filters.fromCity || "all"} onValueChange={(v) => update("fromCity", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All cities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {options.fromCities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>To City</Label>
          <Select value={filters.toCity || "all"} onValueChange={(v) => update("toCity", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All cities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {options.toCities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!hideDestination && (
        <div className="space-y-2">
          <Label>Destination</Label>
          <Select value={filters.destination || "all"} onValueChange={(v) => update("destination", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All destinations" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Destinations</SelectItem>
              {options.destinations.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        )}
        <div className="space-y-2">
          <Label>Date</Label>
          <Select value={filters.date || "all"} onValueChange={(v) => update("date", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All dates" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {options.dates.map((d) => (
                <SelectItem key={d} value={d}>
                  {new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Max Price (PKR)</Label>
          <Input
            type="number"
            placeholder="e.g. 100000"
            value={filters.maxPrice ?? ""}
            onChange={(e) => update("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <div className="space-y-2">
          <Label>Min Seats Left</Label>
          <Input
            type="number"
            placeholder="e.g. 5"
            value={filters.minSeats ?? ""}
            onChange={(e) => update("minSeats", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <div className="space-y-2">
          <Label>Trip Type</Label>
          <Select value={filters.tripType || "all"} onValueChange={(v) => update("tripType", v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="umrah">Umrah</SelectItem>
              <SelectItem value="oneway">One-way</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select value={filters.sortBy || "date"} onValueChange={(v) => update("sortBy", v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="seats">Seats Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="pt-1 text-center text-xs text-muted-foreground">
          Filters apply instantly as you change them.
        </p>
      </CardContent>
    </Card>
  );
}
