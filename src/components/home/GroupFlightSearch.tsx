"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft, Calendar, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  { label: "All Airlines", value: "All Airlines" },
  { label: "PIA", value: "PIA" },
  { label: "Saudia", value: "Saudia" },
  { label: "Emirates", value: "Emirates" },
  { label: "Airblue", value: "Airblue" },
  { label: "Air Sial", value: "AirSial" },
  { label: "Qatar Airways", value: "Qatar Airways" },
  { label: "Fly Jinnah", value: "Fly Jinnah" },
  { label: "Flynas", value: "Flynas" },
];

export function GroupFlightSearch() {
  const router = useRouter();
  const [from, setFrom] = useState("Islamabad");
  const [to, setTo] = useState("Jeddah");
  const [date, setDate] = useState("");
  const [airline, setAirline] = useState("All Airlines");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("fromCity", from);
    if (to) params.set("toCity", to);
    if (date) params.set("date", date);
    if (airline !== "All Airlines") params.set("airline", airline);
    router.push(`/available-tickets/?${params.toString()}`);
  };

  return (
    <section className="relative z-20 -mt-16 pb-8">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <Card className="border-gold/20 shadow-2xl shadow-navy/10">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-widest text-gold">Live Group Inventory</p>
                <h2 className="mt-1 font-heading text-xl font-semibold text-navy md:text-2xl">
                  Search Group Flights
                </h2>
              </div>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-navy">
                      <MapPin className="h-3.5 w-3.5 text-gold" /> From
                    </Label>
                    <Select value={from} onValueChange={(v) => v && setFrom(v)}>
                      <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SEARCH_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFrom(to); setTo(from); }}
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/50 transition hover:rotate-180 hover:border-gold"
                    aria-label="Swap cities"
                  >
                    <ArrowRightLeft className="h-4 w-4 text-navy" />
                  </button>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-navy">
                      <MapPin className="h-3.5 w-3.5 text-gold" /> To
                    </Label>
                    <Select value={to} onValueChange={(v) => v && setTo(v)}>
                      <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SEARCH_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-navy">
                      <Calendar className="h-3.5 w-3.5 text-gold" /> Date
                    </Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-navy">Airline</Label>
                    <Select value={airline} onValueChange={(v) => v && setAirline(v)}>
                      <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {airlines.map((a) => (
                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="h-11 w-full bg-navy text-white hover:bg-navy-light lg:min-w-44">
                      <Search className="mr-2 h-4 w-4" />
                      Search Flights
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
