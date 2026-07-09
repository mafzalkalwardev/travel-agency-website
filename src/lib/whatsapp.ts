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
  passengers: number;
  quotedPrice: number;
  currency?: string;
  supplierRef?: string;
}

export function buildBookingWhatsAppMessage(input: BookingWhatsAppInput): string {
  const ref = input.bookingRef.slice(0, 8).toUpperCase();
  const lines = [
    `Hello ${SITE.name},`,
    ``,
    `I have submitted a booking request and would like to complete payment.`,
    ``,
    `*Reference:* ${ref}`,
    `*Product:* ${input.productTitle}`,
    `*Name:* ${input.customerName}`,
    `*Phone:* ${input.customerPhone}`,
    `*Passengers:* ${input.passengers}`,
    `*Amount:* ${input.quotedPrice.toLocaleString()} ${input.currency || "PKR"}`,
  ];

  if (input.supplierRef) {
    lines.push(`*Supplier Ref:* ${input.supplierRef}`);
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
