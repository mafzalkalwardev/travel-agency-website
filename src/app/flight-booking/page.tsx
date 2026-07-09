import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Flight Booking",
  description: "Search and book group flights with Al Qibla Air Services.",
  path: "/flight-booking/",
});

export default function FlightBookingPage() {
  redirect("/available-tickets/");
}
