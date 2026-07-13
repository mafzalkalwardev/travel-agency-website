"use client";

import Image from "next/image";
import { Briefcase, UtensilsCrossed } from "lucide-react";
import type { MirrorFlightView } from "@/lib/travelline-mirror/types";

interface MirrorFlightCardProps {
  flight: MirrorFlightView;
}

export function MirrorFlightCard({ flight }: MirrorFlightCardProps) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {flight.airlineLogo ? (
            <Image
              src={flight.airlineLogo}
              alt={flight.airlineName}
              width={80}
              height={40}
              className="h-10 w-20 object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-10 w-20 items-center justify-center rounded bg-gray-100 text-xs font-bold">
              {flight.airlineCode}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{flight.routeLabel}</h3>
            <p className="text-xs text-gray-500">{flight.sectorCodes}</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 px-2">
          <div className="text-center">
            <p className="text-xl font-bold">{flight.departureTime}</p>
            <p className="text-xs text-gray-500">{flight.departureDateLabel}</p>
            <p className="text-xs text-gray-600">{flight.fromCity}</p>
          </div>
          <div className="flex flex-col items-center px-2">
            <p className="text-xs text-gray-500">{flight.duration}</p>
            <div className="my-1 h-px w-full min-w-16 bg-gray-300" />
            <p className="text-xs font-medium text-gray-700">{flight.stopsLabel}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{flight.arrivalTime}</p>
            <p className="text-xs text-gray-500">{flight.arrivalDateLabel}</p>
            <p className="text-xs text-gray-600">{flight.toCity}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-xs text-gray-600">
            {flight.baggage && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {flight.baggage}
              </span>
            )}
            <span className="flex items-center gap-1">
              <UtensilsCrossed className="h-3.5 w-3.5" /> {flight.meal || "—"}
            </span>
          </div>
          <div className="rounded-md bg-green-50 px-3 py-2 text-center">
            <p className="text-lg font-bold text-green-800">
              {flight.currency} {flight.price.toLocaleString("en-PK")}
            </p>
            <p className="text-[10px] text-green-700">per person</p>
          </div>
          <button
            type="button"
            className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Select
          </button>
        </div>
      </div>
    </article>
  );
}
