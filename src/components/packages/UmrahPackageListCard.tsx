"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Clock, Hotel, Plane, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AirlineLogo } from "@/components/shared/AirlineLogo";
import { BookRequestSheet } from "@/components/booking/BookRequestSheet";
import { formatPrice, formatTicketDate } from "@/lib/ticket-filters";
import { airlines } from "@/data/airlines";
import { cn } from "@/lib/utils";
import type { TravelPackage } from "@/types";

interface UmrahPackageListCardProps {
  pkg: TravelPackage;
}

function airlineCode(name?: string): string {
  if (!name) return "XX";
  const found = airlines.find((a) => a.name.toLowerCase() === name.toLowerCase());
  if (found) return found.code;
  const map: Record<string, string> = {
    pia: "PK",
    saudia: "SV",
    airsial: "PF",
    "air sial": "PF",
    airblue: "PA",
    emirates: "EK",
  };
  return map[name.toLowerCase()] || name.slice(0, 2).toUpperCase();
}

function formatDeparture(pkg: TravelPackage): string {
  if (pkg.departureDate && pkg.departureTime) {
    // Supplier wall times are Asia/Karachi — pin offset so SSR (UTC host) and
    // the browser never parse the same stamp as different local times.
    const time =
      pkg.departureTime.length === 5 ? `${pkg.departureTime}:00` : pkg.departureTime;
    const date = new Date(`${pkg.departureDate}T${time}+05:00`);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Karachi",
      }).format(date);
    }
  }
  if (pkg.departureDate) return formatTicketDate(pkg.departureDate);
  return pkg.departureCity || "—";
}

function durationLabel(pkg: TravelPackage): string {
  if (pkg.durationDays && pkg.durationNights) {
    return `${pkg.durationDays}D / ${pkg.durationNights}N`;
  }
  return pkg.duration;
}

function detailHighlights(pkg: TravelPackage): string[] {
  return pkg.highlights.filter((h) => !/^makkah:\s*/i.test(h) && !/^madinah:\s*/i.test(h));
}

export function UmrahPackageListCard({ pkg }: UmrahPackageListCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const code = airlineCode(pkg.airline);
  const soldOut = pkg.status === "sold_out" || pkg.seatsLeft === 0;
  const inclusions = detailHighlights(pkg);
  const toCity = "JED";

  return (
    <>
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="overflow-hidden border-border/60 transition-all hover:border-gold/30 hover:shadow-lg">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              <div className="flex w-full items-center justify-center border-b border-border/40 bg-secondary/40 p-4 lg:w-44 lg:border-b-0 lg:border-r lg:p-5">
                <div className="flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-[28%] bg-navy shadow-md sm:h-32 sm:w-32">
                  <AirlineLogo
                    code={code}
                    name={pkg.airline || "Airline"}
                    size="xl"
                    className="rounded-[32%] border-0 shadow-none"
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-lg font-bold text-navy">
                      {pkg.departureCity ? `${pkg.departureCity.slice(0, 3).toUpperCase()}` : "PKG"}
                      <span className="mx-2 text-muted-foreground">→</span>
                      {toCity}
                    </h3>
                    {pkg.flightNumber && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {pkg.flightNumber}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium text-navy">{formatDeparture(pkg)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {durationLabel(pkg)}
                    </span>
                    {pkg.hotelStars ? (
                      <span className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: Math.min(5, pkg.hotelStars) }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </span>
                    ) : null}
                  </div>

                  <p className="line-clamp-1 text-sm font-medium text-navy/80">{pkg.title}</p>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    {pkg.hotelMakkah && (
                      <p className="flex items-start gap-2">
                        <Hotel className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                          <span className="font-medium text-navy">{pkg.hotelMakkah}</span>
                          {pkg.distanceFromHaram ? ` · ${pkg.distanceFromHaram}` : ""}
                          {pkg.makkahNights != null ? ` · ${pkg.makkahNights}N` : ""}
                        </span>
                      </p>
                    )}
                    {pkg.hotelMadinah && (
                      <p className="flex items-start gap-2">
                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                        <span className="font-medium text-navy">
                          {pkg.hotelMadinah}
                          {pkg.madinahNights != null ? ` · ${pkg.madinahNights}N` : ""}
                        </span>
                      </p>
                    )}
                  </div>

                  {pkg.seatsLeft !== undefined && (
                    <p
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        pkg.seatsLeft <= 5 ? "text-amber-600" : "text-green-600"
                      )}
                    >
                      <Users className="h-3.5 w-3.5" />
                      {pkg.seatsLeft} seats left
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end lg:min-w-44">
                  <div className="rounded-md bg-gold/10 px-3 py-2 text-left sm:text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">From</p>
                    <p className="text-2xl font-bold text-navy">
                      {formatPrice(pkg.price, pkg.currency)}
                    </p>
                    <p className="text-xs text-amber-700">/ person</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
                      Details
                    </Button>
                    {soldOut ? (
                      <Button size="sm" disabled>
                        Sold Out
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-navy text-white hover:bg-navy-light"
                        onClick={() => setBookOpen(true)}
                      >
                        Book Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {expanded && (
              <div className="border-t border-border/40 bg-secondary/20 p-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  {pkg.visa ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                      Visa processing
                    </Badge>
                  ) : null}
                  {pkg.transport ? (
                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-800">
                      Transport
                    </Badge>
                  ) : null}
                  {pkg.ziyarat ? (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                      Ziyarat
                    </Badge>
                  ) : null}
                </div>

                <ul className="mt-3 space-y-1.5 text-muted-foreground">
                  {(pkg.returnFlightNumber || pkg.returnDate) && (
                    <li className="flex items-start gap-2">
                      <Plane className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy" />
                      <span>
                        Return
                        {pkg.returnFlightNumber ? ` ${pkg.returnFlightNumber}` : ""}
                        {pkg.returnDate ? ` · ${formatTicketDate(pkg.returnDate)}` : ""}
                      </span>
                    </li>
                  )}
                  {pkg.departureBaggage && (
                    <li>Baggage: {pkg.departureBaggage}</li>
                  )}
                  {pkg.makkahNights != null && pkg.madinahNights != null && (
                    <li>
                      Nights: {pkg.makkahNights} Makkah · {pkg.madinahNights} Madinah
                    </li>
                  )}
                  {pkg.shortDescription && <li>{pkg.shortDescription}</li>}
                  {inclusions.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>

                {!pkg.returnFlightNumber &&
                  !pkg.departureBaggage &&
                  !pkg.shortDescription &&
                  inclusions.length === 0 &&
                  !pkg.visa &&
                  !pkg.transport &&
                  !pkg.ziyarat && (
                    <p className="mt-2 text-muted-foreground">Package details sync with the next inventory refresh.</p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <BookRequestSheet
        open={bookOpen}
        onOpenChange={setBookOpen}
        productType="umrah"
        productTitle={pkg.title}
        quotedPrice={pkg.price}
        currency={pkg.currency}
        umrahPackageId={pkg.id}
        externalProductId={pkg.packageCode}
        sourcePage="/umrah-packages/"
      />
    </>
  );
}
