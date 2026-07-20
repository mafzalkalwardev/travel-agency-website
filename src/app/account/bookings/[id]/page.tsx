import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPageMetadata } from "@/lib/metadata";
import { BookingConfirmation } from "@/components/account/BookingConfirmation";
import type { Booking, Ticket } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Booking Confirmation",
  description: "Your Al Qibla booking details, order reference, and payment status.",
  path: "/account/bookings/",
});

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/account/login/?next=${encodeURIComponent(`/account/bookings/${id}/`)}`);

  // RLS ("Customer read own bookings") already scopes this to the
  // signed-in user (or an admin) — a stranger's booking id 404s here
  // rather than leaking data.
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  let ticket: Ticket | null = null;
  if (booking.ticket_id) {
    const { data: ticketRow } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", booking.ticket_id)
      .maybeSingle();
    if (ticketRow) {
      const raw = (ticketRow.raw_payload || {}) as Record<string, unknown>;
      ticket = {
        id: String(ticketRow.id),
        airline: String(ticketRow.airline),
        airlineCode: String(ticketRow.airline_code),
        flightNumber: String(ticketRow.flight_number),
        from: String(ticketRow.from_code),
        fromCity: String(ticketRow.from_city),
        to: String(ticketRow.to_code),
        toCity: String(ticketRow.to_city),
        sector: String(ticketRow.sector || ""),
        destination: String(ticketRow.destination || ""),
        date: String(ticketRow.departure_date),
        departureTime: String(ticketRow.departure_time || ""),
        arrivalTime: String(ticketRow.arrival_time || ""),
        duration: String(ticketRow.duration || ""),
        price: Number(ticketRow.price),
        currency: String(ticketRow.currency),
        seatsLeft: Number(ticketRow.seats_left),
        status: ticketRow.status as Ticket["status"],
        baggage: ticketRow.baggage as string | undefined,
        meal: ticketRow.meal as string | undefined,
        groupCategory: ticketRow.group_category as string | undefined,
        segments: raw.segments as Ticket["segments"],
        imageUrl: (ticketRow.image_url || raw.imageUrl) as string | undefined,
      };
    }
  }

  return <BookingConfirmation booking={booking as Booking} ticket={ticket} />;
}
