"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft, Calendar, MapPin, Search } from "lucide-react";
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
import { SEARCH_CITIES } from "@/lib/airport-codes";

const airlines = [
  { label: "All Airlines", value: "all" },
  { label: "PIA", value: "PK" },
  { label: "Saudia", value: "SV" },
  { label: "Emirates", value: "EK" },
  { label: "Airblue", value: "PA" },
  { label: "Air Sial", value: "PF" },
  { label: "Qatar Airways", value: "QR" },
  { label: "Fly Jinnah", value: "9P" },
  { label: "Flynas", value: "XY" },
];

interface TicketsSearchBarProps {
  className?: string;
}

export function TicketsSearchBar({ className }: TicketsSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState("Islamabad");
  const [to, setTo] = useState("Jeddah");
  const [date, setDate] = useState("");
  const [airline, setAirline] = useState("all");

  useEffect(() => {
    const fromCity = searchParams.get("fromCity");
    const toCity = searchParams.get("toCity");
    const dateParam = searchParams.get("date");
    const airlineParam = searchParams.get("airline");
    if (fromCity) setFrom(fromCity);
    if (toCity) setTo(toCity);
    if (dateParam) setDate(dateParam);
    if (airlineParam) setAirline(airlineParam);
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

  function swapCities() {
    setFrom(to);
    setTo(from);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className={className}
    >
      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-gold/20 bg-white/95 p-5 shadow-2xl shadow-navy/10 backdrop-blur-md md:p-6"
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 md:gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-navy">
              <MapPin className="h-3.5 w-3.5 text-gold" /> From
            </Label>
            <Select value={from} onValueChange={(v) => v && setFrom(v)}>
              <SelectTrigger className="h-11 w-full border-border/60">
                <SelectValue placeholder="Departure city" />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={swapCities}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/50 text-navy transition hover:rotate-180 hover:border-gold hover:text-gold"
            aria-label="Swap cities"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-navy">
              <MapPin className="h-3.5 w-3.5 text-gold" /> To
            </Label>
            <Select value={to} onValueChange={(v) => v && setTo(v)}>
              <SelectTrigger className="h-11 w-full border-border/60">
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-navy">
              <Calendar className="h-3.5 w-3.5 text-gold" /> Date
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 border-border/60"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-navy">Airline</Label>
            <Select value={airline} onValueChange={(v) => v && setAirline(v)}>
              <SelectTrigger className="h-11 w-full border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {airlines.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="h-11 w-full bg-navy text-white hover:bg-navy-light lg:min-w-40">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
