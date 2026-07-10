import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { createPageMetadata } from "@/lib/metadata";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { assetPath } from "@/lib/base-path";
import { formatPrice } from "@/lib/ticket-filters";
import { dataProvider } from "@/lib/data-provider";
import { SITE } from "@/lib/constants";

export const metadata = createPageMetadata({
  title: "Explore by Destination",
  description: `Explore Umrah, group tickets, visas and tours by destination with ${SITE.name}.`,
  path: "/destinations/",
});

export default async function DestinationsPage() {
  const destinations = await dataProvider.getDestinations();

  return (
    <>
      <PageHero {...PAGE_HEROES.destinations} />
      <section className="section-padding">
        <div className="container-wide">
          <SectionHeading title="Popular Destinations & Services" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((dest) => (
              <Link key={dest.id} href={dest.href} className="destination-card group">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={assetPath(dest.image)}
                    alt={dest.label}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                </div>
                <div className="p-5">
                  <h2 className="font-heading text-xl font-semibold text-navy">{dest.label}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
                    {dest.country}
                  </p>
                  {dest.startingPrice && (
                    <p className="mt-2 text-lg font-bold text-gold">
                      From {formatPrice(dest.startingPrice, dest.currency || "PKR")}
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-royal transition-colors group-hover:text-gold">
                    Explore <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
