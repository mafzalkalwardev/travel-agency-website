import { redirect } from "next/navigation";
import { BookingFlowClient } from "@/components/flight/BookingFlowClient";
import { createPageMetadata } from "@/lib/metadata";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = createPageMetadata({
  title: "Complete Booking",
  description: "Review flight details, add passenger information, choose seats, and confirm booking.",
  path: "/flight-booking/book/",
});

export default async function FlightBookingCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flightId = Array.isArray(params.flightId) ? params.flightId[0] : params.flightId;
  const nextPath = `/flight-booking/book/${flightId ? `?flightId=${encodeURIComponent(flightId)}` : ""}`;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect(`/account/login/?next=${encodeURIComponent(nextPath)}`);
  }

  return <BookingFlowClient flightId={flightId} />;
}
