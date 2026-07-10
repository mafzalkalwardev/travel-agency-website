import Link from "next/link";
import Image from "next/image";
import { createPageMetadata } from "@/lib/metadata";
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((dest) => (
              <Link key={dest.id} href={dest.href} className="destination-card group overflow-hidden">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={assetPath(dest.image)}
                    alt={dest.label}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h2 className="font-semibold text-white">{dest.label}</h2>
                    <p className="text-xs text-white/70">{dest.country}</p>
                    {dest.startingPrice && (
                      <p className="mt-1 text-sm font-semibold text-gold">
                        From {formatPrice(dest.startingPrice, dest.currency || "PKR")}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
