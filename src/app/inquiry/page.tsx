import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO } from "@/lib/seo";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";

export const metadata = createPageMetadata({
  title: PAGE_SEO.inquiry.title,
  description: PAGE_SEO.inquiry.description,
  path: PAGE_SEO.inquiry.path,
  keywords: PAGE_SEO.inquiry.keywords,
});

export default function InquiryPage() {
  return (
    <>
      <PageHero {...PAGE_HEROES.inquiry} />
      <section className="section-padding relative overflow-hidden bg-[#f4efe7]">
        <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#0a2342_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="container-wide relative max-w-6xl">
          <InquiryForm />
        </div>
      </section>
    </>
  );
}
