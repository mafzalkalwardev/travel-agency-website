"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { TravelLineUmrahApiItem } from "@/lib/travelline/mappers";

interface MirrorUmrahPackagesClientProps {
  packages: TravelLineUmrahApiItem[];
  scrapedAt: string;
}

function stars(rating?: number) {
  if (!rating) return null;
  return "★".repeat(Math.min(5, rating));
}

export function MirrorUmrahPackagesClient({ packages, scrapedAt }: MirrorUmrahPackagesClientProps) {
  const [search, setSearch] = useState("");
  const [departure, setDeparture] = useState("all");
  const [airline, setAirline] = useState("all");

  const departures = useMemo(
    () => [...new Set(packages.map((p) => p.fromCity).filter(Boolean))].sort(),
    [packages]
  );
  const airlines = useMemo(
    () => [...new Set(packages.map((p) => p.airline).filter(Boolean))].sort(),
    [packages]
  );

  const filtered = useMemo(() => {
    return packages.filter((p) => {
      if (departure !== "all" && p.fromCity !== departure) return false;
      if (airline !== "all" && p.airline !== airline) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [p.title, p.airline, p.fromCity, p.hotel?.makkahName, p.hotel?.madinahName, p.departureFlightNo]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [packages, search, departure, airline]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold text-white">Umrah Packages</h1>
      <p className="mb-6 text-xs text-white/40">
        Raw API data · {packages.length} packages · synced {new Date(scrapedAt).toLocaleString()}
      </p>

      <div className="mb-6 grid gap-3 rounded-lg border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
        <input
          type="search"
          placeholder="Search by package title, hotel, airline..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <select
          value={departure}
          onChange={(e) => setDeparture(e.target.value)}
          className="rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white"
        >
          <option value="all">Any Departure</option>
          {departures.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={airline}
          onChange={(e) => setAirline(e.target.value)}
          className="rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white"
        >
          <option value="all">Any Airline</option>
          {airlines.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <p className="mb-4 text-sm text-white/70">
        Showing <strong>{filtered.length}</strong> of <strong>{packages.length}</strong> packages · Sorted by earliest departure
      </p>

      <div className="space-y-3">
        {filtered.map((pkg) => (
          <article
            key={pkg.id}
            className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-900 lg:flex-row lg:items-center"
          >
            <div className="flex w-28 shrink-0 items-center justify-center rounded bg-gray-900 p-3 text-center text-xs font-bold text-white">
              {(pkg.airline || "PKG").slice(0, 12).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold">
                  {pkg.departureSectorFrom} → {pkg.departureSectorTo}
                </span>
                {pkg.departureFlightNo && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">{pkg.departureFlightNo}</span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium">
                {pkg.departureDate} {pkg.departureTime}
                {pkg.durationDays ? ` · ${pkg.durationDays}D / ${pkg.durationNights ?? pkg.durationDays - 1}N` : ""}
                {pkg.hotel?.rating ? ` · ${stars(pkg.hotel.rating)}` : ""}
              </p>
              {pkg.hotel?.makkahName && (
                <p className="text-sm text-gray-600">🏨 {pkg.hotel.makkahName} {pkg.hotel.makkahDistance || ""}</p>
              )}
              {pkg.hotel?.madinahName && (
                <p className="text-sm text-gray-600">🏨 {pkg.hotel.madinahName}</p>
              )}
              <p className="text-xs text-gray-500">{pkg.title}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-[10px] uppercase text-gray-500">From</p>
                <p className="text-2xl font-bold text-green-700">
                  Rs {pkg.price.toLocaleString("en-PK")}
                </p>
                <p className="text-xs text-gray-500">/ person · {pkg.seatsAvailable ?? 0} seats</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded border px-3 py-1.5 text-sm">Details</button>
                <button type="button" className="rounded bg-green-700 px-3 py-1.5 text-sm text-white">Book Now</button>
              </div>
            </div>
            {pkg.airlineLogo && (
              <Image src={pkg.airlineLogo} alt="" width={1} height={1} className="hidden" unoptimized />
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
