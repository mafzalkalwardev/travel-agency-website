import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BedDouble } from "lucide-react";
import { assetPath } from "@/lib/base-path";
import { GsapParallax } from "@/components/motion/GsapParallax";
import { GsapReveal } from "@/components/motion/GsapReveal";
import { GsapStagger, GsapStaggerItem } from "@/components/motion/GsapStagger";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { Destination } from "@/types";

interface DestinationGridProps {
  destinations: Destination[];
}

export function DestinationGrid({ destinations }: DestinationGridProps) {
  const exploreCards = destinations
    .filter((d) => d.slug && ["umrah-packages", "umrah-groups", "uae-oneway", "oman-oneway", "ksa-oneway"].includes(d.slug))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <section className="section-padding bg-light-bg">
      <div className="container-wide">
        <GsapReveal>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              title="Explore by Destination"
              subtitle="Select a destination to browse available group flights"
              align="left"
            />
            <Link href="/destinations/" className="text-sm font-medium text-royal hover:text-gold">
              View All →
            </Link>
          </div>
        </GsapReveal>
        <GsapParallax>
          <GsapStagger className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {exploreCards.map((dest) => (
              <GsapStaggerItem key={dest.id} className="h-full">
                <Link href={dest.href} className="destination-card group block h-full">
                  <div data-parallax-frame className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
                    <Image
                      data-parallax-img
                      src={assetPath(dest.image)}
                      alt={dest.label}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="scale-110 object-cover transition-transform duration-700 group-hover:scale-[1.15]"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/40 to-navy/10" />
                    {dest.slug === "umrah-packages" && (
                      <span className="absolute left-3 top-3 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                        2026 Season
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-4 pb-4 pt-12">
                      <h3 className="font-heading text-base font-bold leading-tight text-white drop-shadow-md">
                        {dest.label}
                      </h3>
                      {dest.subtitle ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-gold-light">
                          <BedDouble className="h-3 w-3 shrink-0" aria-hidden />
                          {dest.subtitle}
                        </p>
                      ) : dest.availableCount !== undefined && dest.availableCount > 0 ? (
                        <p className="mt-1 text-xs text-white/80">{dest.availableCount} flights</p>
                      ) : null}
                      <span className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-navy">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </GsapStaggerItem>
            ))}
          </GsapStagger>
        </GsapParallax>
        {exploreCards.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Inventory syncing — check back shortly.</p>
        )}
      </div>
    </section>
  );
}
