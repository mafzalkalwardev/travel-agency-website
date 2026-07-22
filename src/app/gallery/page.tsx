import { createPageMetadata } from "@/lib/metadata";
import { GalleryGrid } from "@/components/shared/GalleryGrid";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { dataProvider } from "@/lib/data-provider";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Gallery",
  description: `Photo gallery from ${SITE.name} — Umrah journeys, travel experiences and destinations.`,
  path: "/gallery/",
});

export default async function GalleryPage() {
  const images = await dataProvider.getGalleryImages();

  return (
    <>
      <PageHero {...PAGE_HEROES.gallery} />

      <section className="section-padding">
        <div className="container-wide">
          <GalleryGrid images={images} />
        </div>
      </section>
    </>
  );
}
