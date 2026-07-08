"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Leaf, Luggage, Plane, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { assetPath } from "@/lib/base-path";
import { calculateLayoverTime, formatCurrency, formatDateTime, formatDuration } from "@/lib/flight-booking";
import { cn } from "@/lib/utils";
import type { FlightOption } from "@/types/flight-booking";

interface FlightCardProps {
  flight: FlightOption;
  index: number;
}

const tagClass: Record<string, string> = {
  Cheapest: "bg-emerald-100 text-emerald-800",
  Fastest: "bg-sky-100 text-sky-800",
  "Best Value": "bg-amber-100 text-amber-800",
  Recommended: "bg-navy text-white",
};

export function FlightCard({ flight, index }: FlightCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="grid gap-5 p-5 lg:grid-cols-[180px_1fr_190px] lg:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
            <Image
              src={assetPath(flight.airlineLogo)}
              alt={flight.airline}
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              unoptimized
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <span className="sr-only">{flight.airline}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-950">{flight.airline}</p>
            <p className="text-sm text-slate-500">{flight.flightNumber}</p>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="text-2xl font-bold text-navy">{flight.from}</p>
              <p className="text-sm text-slate-500">{flight.fromCity}</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formatDateTime(flight.departureTime)}</p>
            </div>
            <div className="min-w-28 text-center">
              <p className="mb-1 flex items-center justify-center gap-1 text-xs font-semibold text-slate-500">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(flight.durationMinutes)}
              </p>
              <div className="flex items-center gap-1">
                <span className="h-px flex-1 bg-slate-200" />
                <Plane className="h-4 w-4 text-gold" />
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <p className="mt-1 text-xs text-slate-500">{calculateLayoverTime(flight)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-navy">{flight.to}</p>
              <p className="text-sm text-slate-500">{flight.toCity}</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formatDateTime(flight.arrivalTime)}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {flight.tags.map((tag) => (
              <Badge key={tag} className={cn("rounded-full", tagClass[tag])}>
                {tag}
              </Badge>
            ))}
            <Badge variant="outline" className="rounded-full">
              <Luggage className="mr-1 h-3 w-3" /> {flight.baggage}
            </Badge>
            {flight.refundable && (
              <Badge variant="outline" className="rounded-full text-emerald-700">
                <ShieldCheck className="mr-1 h-3 w-3" /> Refundable
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-4 lg:flex-col lg:items-end">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-slate-500">from</p>
            <motion.p
              animate={{ color: ["#d6a84f", "#071B3A", "#d6a84f"] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-3xl font-bold"
            >
              {formatCurrency(flight.price, flight.currency)}
            </motion.p>
            <p className="text-xs text-slate-500">per traveler</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
              Details
              <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", open && "rotate-180")} />
            </Button>
            <Link
              href={`/flight-booking/book/?flightId=${flight.id}`}
              className={cn(buttonVariants({ variant: "navy", size: "sm" }))}
            >
              Select
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-100 bg-slate-50"
          >
            <div className="grid gap-4 p-5 text-sm text-slate-600 md:grid-cols-4">
              <p><strong className="text-slate-900">Aircraft:</strong> {flight.aircraft}</p>
              <p><strong className="text-slate-900">Cabin:</strong> {flight.cabinClass}</p>
              <p><strong className="text-slate-900">Stops:</strong> {flight.stops === 0 ? "Direct" : flight.layovers.join(", ")}</p>
              <p className="flex items-center gap-1"><Leaf className="h-4 w-4 text-emerald-500" /> {flight.carbonKg}kg CO2 estimate</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
