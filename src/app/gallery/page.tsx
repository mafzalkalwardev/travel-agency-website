import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO } from "@/lib/seo";
import { GalleryGrid } from "@/components/shared/GalleryGrid";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { dataProvider } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: PAGE_SEO.gallery.title,
  description: PAGE_SEO.gallery.description,
  path: PAGE_SEO.gallery.path,
  keywords: PAGE_SEO.gallery.keywords,
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
