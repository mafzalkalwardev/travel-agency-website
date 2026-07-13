"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MirrorFlightCard } from "@/components/travelline-mirror/MirrorFlightCard";
import {
  filterFlights,
  getAirlineFilters,
  getSectorFilters,
} from "@/lib/travelline-mirror/views";
import { EXPLORE_CATEGORIES } from "@/lib/travelline/categories";
import type { MirrorFlightView } from "@/lib/travelline-mirror/types";

interface MirrorGroupsClientProps {
  categoryLabel: string;
  categorySlug: string;
  apiCategory: string;
  flights: MirrorFlightView[];
  scrapedAt: string;
}

export function MirrorGroupsClient({
  categoryLabel,
  categorySlug,
  apiCategory,
  flights,
  scrapedAt,
}: MirrorGroupsClientProps) {
  const [airlines, setAirlines] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);

  const airlineOptions = useMemo(() => getAirlineFilters(flights), [flights]);
  const sectorOptions = useMemo(() => getSectorFilters(flights), [flights]);
  const filtered = useMemo(
    () => filterFlights(flights, { airlines, sectors }),
    [flights, airlines, sectors]
  );

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  const categories = EXPLORE_CATEGORIES.filter((c) => c.kind === "group-flights");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-sm text-white/80">
          Showing flights for: <strong className="text-white">{categoryLabel}</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/tl-mirror/groups/${c.slug}/`}
              className={`rounded px-2 py-1 text-xs ${c.slug === categorySlug ? "bg-blue-600 text-white" : "text-blue-400 hover:underline"}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <p className="mb-4 text-xs text-white/40">
        Raw scrape: {flights.length} flights · {apiCategory} · synced {new Date(scrapedAt).toLocaleString()}
      </p>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6 rounded-lg border border-gray-200 bg-white p-4 text-gray-900">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Airlines</h3>
            <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {airlineOptions.map((name) => (
                <label key={name} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={airlines.includes(name)}
                    onChange={() => toggle(airlines, name, setAirlines)}
                    className="rounded"
                  />
                  {name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Sectors</h3>
            <div className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {sectorOptions.map((sector) => (
                <label key={sector} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sectors.includes(sector)}
                    onChange={() => toggle(sectors, sector, setSectors)}
                    className="rounded"
                  />
                  <span className="leading-tight">{sector}</span>
                </label>
              ))}
            </div>
          </div>
          {(airlines.length > 0 || sectors.length > 0) && (
            <button
              type="button"
              onClick={() => { setAirlines([]); setSectors([]); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </aside>

        <div className="space-y-4">
          <p className="text-sm text-white/70">
            {filtered.length} of {flights.length} flights
          </p>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/20 p-12 text-center text-white/60">
              No flights in this category.
            </div>
          ) : (
            filtered.map((flight) => <MirrorFlightCard key={flight.id} flight={flight} />)
          )}
        </div>
      </div>
    </div>
  );
}
