import { createPageMetadata } from "@/lib/metadata";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { SITE } from "@/lib/constants";

export const metadata = createPageMetadata({
  title: "Book / Inquiry",
  description: `Submit a booking or travel inquiry to ${SITE.name} via WhatsApp.`,
  path: "/inquiry/",
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
