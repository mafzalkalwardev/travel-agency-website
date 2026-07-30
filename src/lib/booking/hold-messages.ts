/** Map raw supplier/axios errors to clear operator-facing copy (no supplier brand names). */
export function humanizeSupplierHoldError(raw?: string | null): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  if (/status code 423|\b423\b/i.test(text)) {
    return "Inventory is temporarily locked (HTTP 423) — no seat was held. Usually a short lock or seats held elsewhere. Retry later or choose another flight.";
  }
  if (/status code 401|\b401\b|unauthorized/i.test(text)) {
    return "Supplier session expired (401) — seat was not held. Retry after connection recovers.";
  }
  if (/status code 409|\b409\b|conflict/i.test(text)) {
    return "Booking conflict (409) — seat was not held. Inventory may already be reserved.";
  }
  if (/passport/i.test(text)) {
    return text.replace(/\bTravel Line\b/gi, "supplier");
  }
  if (/Request failed with status code (\d+)/i.test(text)) {
    const code = text.match(/Request failed with status code (\d+)/i)?.[1];
    return `Supplier request failed (HTTP ${code}) — seat was not held.`;
  }
  return text.replace(/\bTravel Line\b/gi, "supplier").replace(/\bTravelLine\b/gi, "supplier");
}

/** Extract YYYY-MM-DD from titles like "... (2026-07-25)". */
export function extractFlightDateFromTitle(title?: string | null): string | null {
  if (!title) return null;
  const m = title.match(/\((\d{4}-\d{2}-\d{2})\)/);
  return m?.[1] ?? null;
}
