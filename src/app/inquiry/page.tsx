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
      <section className="section-padding">
        <div className="container-wide max-w-2xl">
          <InquiryForm />
        </div>
      </section>
    </>
  );
}
