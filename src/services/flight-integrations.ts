import type { FlightOption, FlightSearchCriteria, PassengerDetails } from "@/types/flight-booking";

export type FlightProvider = "amadeus" | "duffel" | "sabre";

export interface FlightSearchProviderResponse {
  provider: FlightProvider;
  flights: FlightOption[];
  isLive: boolean;
  checkedAt: string;
}

export interface BookingConfirmationJob {
  bookingReference: string;
  passenger: Pick<PassengerDetails, "firstName" | "lastName" | "email" | "phone">;
  channel: "email" | "sms" | "whatsapp";
  status: "queued" | "sent" | "failed";
}

export async function searchFlightProvider(
  criteria: FlightSearchCriteria,
  provider: FlightProvider
): Promise<FlightSearchProviderResponse> {
  return {
    provider,
    flights: [],
    isLive: false,
    checkedAt: new Date().toISOString(),
  };
}

export function createFareAlertPayload(criteria: FlightSearchCriteria, targetPrice: number) {
  return {
    criteria,
    targetPrice,
    status: "ready",
    nextCheckMinutes: 15,
  };
}

export function queueBookingConfirmation(job: Omit<BookingConfirmationJob, "status">): BookingConfirmationJob {
  return {
    ...job,
    status: "queued",
  };
}

import { isTravelLineConfigured } from "@/lib/travelline/env";
import { isEmailConfigured } from "@/lib/email/resend";

export function getFlightAutomationReadiness() {
  const travelline = isTravelLineConfigured();
  const email = isEmailConfigured();

  return [
    {
      label: "Travel Line inventory",
      status: travelline ? "live" : "not configured",
      detail: travelline
        ? "Group flights synced every 5 min via GitHub Actions"
        : "Set TRAVELLINE_AGENT_USERNAME and TRAVELLINE_AGENT_PASSWORD",
    },
    {
      label: "Supplier holds",
      status: travelline ? "live" : "offline",
      detail: "Holds placed on booking submit via POST /api/booking",
    },
    {
      label: "Booking emails",
      status: email ? "live" : "optional",
      detail: email ? "Resend sends customer + admin notifications" : "Configure RESEND_API_KEY for email",
    },
    {
      label: "WhatsApp payment",
      status: "live",
      detail: "Customers complete payment via WhatsApp after hold",
    },
    {
      label: "Customer approval",
      status: "live",
      detail: "New agents require admin approval before booking",
    },
  ] as const;
}
