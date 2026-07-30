import { PAYMENT, SITE } from "./constants";

export function whatsappLink(message: string): string {
  return `${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function bookingMessage(topic: string, details?: string): string {
  const base = `Hello ${SITE.name}, I would like to inquire about ${topic}.`;
  return details ? `${base}\n\n${details}` : base;
}

export interface BookingWhatsAppInput {
  bookingRef: string;
  productTitle: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  passengers: number;
  passengerNames?: string;
  quotedPrice: number;
  currency?: string;
  supplierRef?: string;
  supplierHeld?: boolean;
  /** Ticket / itinerary extras */
  route?: string;
  departureDate?: string;
  flightNumber?: string;
  airline?: string;
  notes?: string;
}

export function buildBookingWhatsAppMessage(input: BookingWhatsAppInput): string {
  const ref = input.bookingRef.slice(0, 8).toUpperCase();
  const lines = [
    `Hello ${SITE.name},`,
    ``,
    `I just booked online and would like to complete payment.`,
    ``,
    `*Reference:* ${ref}`,
    `*Ticket / Product:* ${input.productTitle}`,
  ];

  if (input.airline || input.flightNumber) {
    lines.push(
      `*Flight:* ${[input.airline, input.flightNumber].filter(Boolean).join(" ")}`
    );
  }
  if (input.route) lines.push(`*Route:* ${input.route}`);
  if (input.departureDate) lines.push(`*Date:* ${input.departureDate}`);

  lines.push(
    `*Customer:* ${input.customerName}`,
    `*Phone:* ${input.customerPhone}`
  );

  if (input.customerEmail) lines.push(`*Email:* ${input.customerEmail}`);
  lines.push(`*Passengers:* ${input.passengers}`);
  if (input.passengerNames) lines.push(`*Passenger names:* ${input.passengerNames}`);
  if (input.notes) lines.push(`*Notes:* ${input.notes}`);

  lines.push(
    `*Amount:* ${input.quotedPrice.toLocaleString()} ${input.currency || "PKR"}`
  );

  if (input.supplierRef) {
    lines.push(`*Booking ref:* ${input.supplierRef}`);
    if (input.supplierHeld !== false) {
      lines.push(`*Seats:* held pending payment`);
    }
  } else if (input.supplierHeld === false) {
    lines.push(`*Seats:* hold pending — please confirm seats`);
  }

  lines.push(
    ``,
    `*Payment:* ${PAYMENT.instructions}`,
    PAYMENT.bankName ? `Bank: ${PAYMENT.bankName}` : "",
    PAYMENT.accountTitle ? `Account: ${PAYMENT.accountTitle}` : "",
    PAYMENT.accountNumber ? `A/C: ${PAYMENT.accountNumber}` : "",
    ``,
    `I will send my payment screenshot here. Please confirm my booking.`
  );

  return lines.filter(Boolean).join("\n");
}
