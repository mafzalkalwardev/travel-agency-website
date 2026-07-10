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
}

export function TicketFiltersPanel({
  filters,
  onChange,
  options,
  airlineNames,
}: TicketFiltersPanelProps) {
  const update = (key: keyof TicketFilters, value: string | number | null | undefined) => {
    onChange({ ...filters, [key]: !value || value === "all" ? undefined : value });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy">Filters</p>
        <Button variant="ghost" size="sm" onClick={() => onChange({})} className="h-7 px-2 text-xs text-muted-foreground">
          <X className="mr-1 h-3 w-3" /> Clear
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Airline</Label>
          <Select value={filters.airline || "all"} onValueChange={(v) => update("airline", v)}>
            <SelectTrigger className="h-9 w-full"><SelectValue placeholder="All airlines" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Airlines</SelectItem>
              {options.airlines.map((code) => (
                <SelectItem key={code} value={code}>{airlineNames[code] || code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Select value={filters.fromCity || "all"} onValueChange={(v) => update("fromCity", v)}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {options.fromCities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Select value={filters.toCity || "all"} onValueChange={(v) => update("toCity", v)}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {options.toCities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Select value={filters.date || "all"} onValueChange={(v) => update("date", v)}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
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

        <div className="space-y-1.5">
          <Label className="text-xs">Max Price (PKR)</Label>
          <Input
            type="number"
            placeholder="Optional"
            className="h-9"
            value={filters.maxPrice ?? ""}
            onChange={(e) => update("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Sort</Label>
          <Select value={filters.sortBy || "date"} onValueChange={(v) => update("sortBy", v)}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="seats">Seats Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
