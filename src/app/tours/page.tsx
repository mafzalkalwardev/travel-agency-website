import Link from "next/link";
import { ArrowRight, Clock, MapPin, MessageCircle } from "lucide-react";
import { createPageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SafeImage } from "@/components/shared/SafeImage";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { FALLBACK_IMAGES } from "@/lib/image-utils";
import { formatPrice } from "@/lib/ticket-filters";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SITE } from "@/lib/constants";

// Admin-managed content; cache for a minute so edits appear quickly.
export const revalidate = 60;

export const metadata = createPageMetadata({
  title: "Tours",
  description: `Guided tours, group trips and travel experiences curated by ${SITE.name}.`,
  path: "/tours/",
});

interface TourRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  location: string | null;
  duration: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  featured: boolean | null;
}

async function getTours(): Promise<TourRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createAdminClient()
      .from("tours")
      .select("id,title,slug,excerpt,location,duration,price,currency,image_url,featured,display_order,status,created_at")
      .eq("status", "active")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as TourRow[];
  } catch {
    return [];
  }
}

function whatsappLink(title: string) {
  const text = `Assalam o Alaikum, I'm interested in the "${title}" tour. Please share details.`;
  return `${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}

export default async function ToursPage() {
  const tours = await getTours();

  return (
    <>
      <PageHero
        title="Tours"
        subtitle="Guided tours, group trips and curated travel experiences — enquire and we'll plan the details with you."
        backgroundImage={PAGE_HEROES.tours.backgroundImage}
        badge={tours.length ? `${tours.length} Tours` : undefined}
      />

      <section className="section-padding">
        <div className="container-wide">
          <SectionHeading
            title="Explore our tours"
            subtitle="Handpicked destinations and group departures — message us to reserve your place"
          />

          {tours.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour) => (
                <article
                  key={tour.id}
                  className="card-premium group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-navy-light">
                    <SafeImage
                      src={tour.image_url}
                      fallbackSrc={FALLBACK_IMAGES.tour}
                      alt={tour.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
                    {tour.featured && (
                      <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading text-lg font-semibold leading-snug text-navy">{tour.title}</h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {tour.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
                          {tour.location}
                        </span>
                      )}
                      {tour.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-gold" />
                          {tour.duration}
                        </span>
                      )}
                    </div>

                    {tour.excerpt && (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{tour.excerpt}</p>
                    )}

                    <div className="mt-auto pt-5">
                      {tour.price ? (
                        <p className="text-xl font-bold text-gold">
                          {formatPrice(tour.price, tour.currency || "PKR")}
                        </p>
                      ) : null}
                      <a
                        href={whatsappLink(tour.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-2.5 font-semibold text-white transition hover:bg-navy-light"
                      >
                        <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-xl rounded-2xl border border-border bg-secondary/40 p-8 text-center">
              <p className="text-muted-foreground">
                New tours are coming soon. Contact us on WhatsApp for custom itineraries and group departures.
              </p>
              <a
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 font-semibold text-navy transition hover:bg-gold-light"
              >
                Message us <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
