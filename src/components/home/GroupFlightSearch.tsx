"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEARCH_CITIES } from "@/lib/airport-codes";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-md border border-border/60 bg-white px-3 text-sm text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

export function GroupFlightSearch() {
  const router = useRouter();
  const [from, setFrom] = useState("Islamabad");
  const [to, setTo] = useState("Jeddah");
  const [date, setDate] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("fromCity", from);
    if (to) params.set("toCity", to);
    if (date) params.set("date", date);
    router.push(`/available-tickets/?${params.toString()}`);
  };

  return (
    <section className="relative z-20 -mt-8 pb-4">
      <div className="container-wide">
        <form
          onSubmit={handleSearch}
          className="rounded-xl border border-border/60 bg-white p-4 shadow-lg shadow-navy/5 md:p-5"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
            {mounted ? (
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={selectClass}
                aria-label="From city"
              >
                {SEARCH_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <div className={cn(selectClass, "flex items-center text-muted-foreground")}>Islamabad</div>
            )}

            <button
              type="button"
              onClick={() => {
                setFrom(to);
                setTo(from);
              }}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-navy transition hover:border-gold hover:text-gold"
              aria-label="Swap cities"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            {mounted ? (
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={selectClass}
                aria-label="To city"
              >
                {SEARCH_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <div className={cn(selectClass, "flex items-center text-muted-foreground")}>Jeddah</div>
            )}

            <Button type="submit" className="h-11 bg-navy text-white hover:bg-navy-light sm:col-span-1">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
          <div className="mt-3 sm:max-w-xs">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 border-border/60"
              placeholder="Travel date (optional)"
            />
          </div>
        </form>
      </div>
    </section>
  );
}
