import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: PAGE_SEO.flightBooking.title,
  description: PAGE_SEO.flightBooking.description,
  path: PAGE_SEO.flightBooking.path,
  keywords: PAGE_SEO.flightBooking.keywords,
});

export default function FlightBookingPage() {
  redirect("/available-tickets/");
}
