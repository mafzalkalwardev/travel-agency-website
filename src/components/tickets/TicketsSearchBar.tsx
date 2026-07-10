"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEARCH_CITIES } from "@/lib/airport-codes";

const airlines = [
  { label: "All Airlines", value: "all" },
  { label: "PIA", value: "PK" },
  { label: "Saudia", value: "SV" },
  { label: "Emirates", value: "EK" },
  { label: "Airblue", value: "PA" },
  { label: "Air Sial", value: "PF" },
  { label: "Qatar Airways", value: "QR" },
];

interface TicketsSearchBarProps {
  className?: string;
}

export function TicketsSearchBar({ className }: TicketsSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [airline, setAirline] = useState("all");

  useEffect(() => {
    setFrom(searchParams.get("fromCity") || "");
    setTo(searchParams.get("toCity") || "");
    setDate(searchParams.get("date") || "");
    setAirline(searchParams.get("airline") || "all");
  }, [searchParams]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("fromCity", from);
    if (to) params.set("toCity", to);
    if (date) params.set("date", date);
    if (airline !== "all") params.set("airline", airline);
    router.push(`/available-tickets/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className={className}
    >
      <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
          <Select value={from || "all"} onValueChange={(v) => setFrom(!v || v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 w-full"><SelectValue placeholder="From city" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any city</SelectItem>
              {SEARCH_CITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={() => { const t = from; setFrom(to); setTo(t); }}
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-navy hover:border-gold"
            aria-label="Swap cities"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </button>

          <Select value={to || "all"} onValueChange={(v) => setTo(!v || v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 w-full"><SelectValue placeholder="To city" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any city</SelectItem>
              {SEARCH_CITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" className="h-10 bg-navy text-white hover:bg-navy-light">
            <Search className="mr-1.5 h-4 w-4" />
            Search
          </Button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
          <Select value={airline} onValueChange={(v) => v && setAirline(v)}>
            <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Airline" /></SelectTrigger>
            <SelectContent>
              {airlines.map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </form>
  );
}
