import { createPageMetadata } from "@/lib/metadata";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { SITE } from "@/lib/constants";

export const metadata = createPageMetadata({
  title: "Book / Inquiry",
  description: `Submit a booking or travel inquiry to ${SITE.name} via WhatsApp.`,
  path: "/inquiry/",
});

export default function InquiryPage() {
  return (
    <section className="section-padding">
      <div className="container-wide max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-navy">Book / Inquiry</h1>
          <p className="mt-1 text-sm text-muted-foreground">We&apos;ll respond on WhatsApp</p>
        </div>
        <InquiryForm />
      </div>
    </section>
  );
}
