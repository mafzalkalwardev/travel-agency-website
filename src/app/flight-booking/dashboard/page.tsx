import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Traveler Dashboard",
  description: "Manage your bookings with Al Qibla Air Services.",
  path: "/flight-booking/dashboard/",
});

export default function FlightBookingDashboardPage() {
  redirect("/account/");
}
