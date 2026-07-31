/** Normalize booking passenger_details into display / hold payloads. */

export type TravelerName = { firstName: string; lastName: string };

export function travelersFromPassengerDetails(
  details: Record<string, unknown> | null | undefined
): TravelerName[] {
  if (!details) return [];

  const raw = details.travelers;
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((row) => {
        const item = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        return {
          firstName: String(item.firstName || item.givenName || "").trim(),
          lastName: String(item.lastName || item.surname || "").trim(),
        };
      })
      .filter((t) => t.firstName || t.lastName);
  }

  const firstName = String(details.firstName || details.givenName || "").trim();
  const lastName = String(details.lastName || details.surname || "").trim();
  if (firstName || lastName) {
    return [{ firstName, lastName }];
  }

  return String(details.names || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
      return {
        firstName: parts.slice(0, -1).join(" "),
        lastName: parts[parts.length - 1],
      };
    });
}

export function formatTravelerFullName(traveler: TravelerName): string {
  return `${traveler.firstName} ${traveler.lastName}`.trim();
}

export function passengerNamesSummary(
  details: Record<string, unknown> | null | undefined
): string {
  return travelersFromPassengerDetails(details)
    .map(formatTravelerFullName)
    .filter(Boolean)
    .join("\n");
}

export function buildPassengerDetailsPayload(input: {
  travelers: TravelerName[];
  passportNo: string;
  dob: string;
  nationality?: string;
  notes?: string;
}) {
  const travelers = input.travelers
    .map((t) => ({
      firstName: t.firstName.trim(),
      lastName: t.lastName.trim(),
    }))
    .filter((t) => t.firstName && t.lastName);

  const names = travelers.map(formatTravelerFullName).join("\n");
  const primary = travelers[0] || { firstName: "", lastName: "" };

  return {
    travelers,
    firstName: primary.firstName,
    lastName: primary.lastName,
    names,
    passportNo: input.passportNo.trim(),
    dob: input.dob.trim(),
    nationality: (input.nationality || "PK").trim().toUpperCase().slice(0, 2) || "PK",
    notes: input.notes?.trim() || undefined,
  };
}
