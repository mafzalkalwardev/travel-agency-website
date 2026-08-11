/** Normalize booking passenger_details into display / hold payloads. */

export type TravelerName = {
  firstName: string;
  lastName: string;
  passportNo?: string;
  dob?: string;
  nationality?: string;
};

export type TravelerDetails = Required<
  Pick<TravelerName, "firstName" | "lastName" | "passportNo" | "dob" | "nationality">
>;

export function emptyTraveler(): TravelerDetails {
  return {
    firstName: "",
    lastName: "",
    passportNo: "",
    dob: "",
    nationality: "PK",
  };
}

export function travelersFromPassengerDetails(
  details: Record<string, unknown> | null | undefined
): TravelerName[] {
  if (!details) return [];

  const topPassport = String(details.passportNo || details.passport || "").trim();
  const topDob = String(details.dob || "").trim();
  const topNationality = String(details.nationality || "PK").trim() || "PK";

  const raw = details.travelers;
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((row) => {
        const item = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        return {
          firstName: String(item.firstName || item.givenName || "").trim(),
          lastName: String(item.lastName || item.surname || "").trim(),
          passportNo: String(item.passportNo || item.passport || topPassport || "").trim(),
          dob: String(item.dob || topDob || "").trim(),
          nationality: String(item.nationality || topNationality || "PK")
            .trim()
            .toUpperCase()
            .slice(0, 2),
        };
      })
      .filter((t) => t.firstName || t.lastName);
  }

  const firstName = String(details.firstName || details.givenName || "").trim();
  const lastName = String(details.lastName || details.surname || "").trim();
  if (firstName || lastName) {
    return [
      {
        firstName,
        lastName,
        passportNo: topPassport,
        dob: topDob,
        nationality: topNationality.toUpperCase().slice(0, 2),
      },
    ];
  }

  return String(details.names || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      if (parts.length === 1) {
        return {
          firstName: parts[0],
          lastName: parts[0],
          passportNo: topPassport,
          dob: topDob,
          nationality: topNationality.toUpperCase().slice(0, 2),
        };
      }
      return {
        firstName: parts.slice(0, -1).join(" "),
        lastName: parts[parts.length - 1],
        passportNo: topPassport,
        dob: topDob,
        nationality: topNationality.toUpperCase().slice(0, 2),
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
  notes?: string;
}) {
  const travelers = input.travelers
    .map((t) => ({
      firstName: t.firstName.trim(),
      lastName: t.lastName.trim(),
      passportNo: String(t.passportNo || "").trim(),
      dob: String(t.dob || "").trim(),
      nationality: (String(t.nationality || "PK").trim().toUpperCase().slice(0, 2) || "PK"),
    }))
    .filter((t) => t.firstName && t.lastName);

  const incomplete = travelers.find(
    (t) => !t.passportNo || t.passportNo.length < 5 || !t.dob || t.dob.length < 8
  );
  if (incomplete) {
    throw new Error(
      "Enter passport number, date of birth, and nationality for each passenger."
    );
  }

  const names = travelers.map(formatTravelerFullName).join("\n");
  const primary = travelers[0] || emptyTraveler();

  return {
    travelers,
    firstName: primary.firstName,
    lastName: primary.lastName,
    names,
    // Top-level kept for older admin/email code paths (primary traveler).
    passportNo: primary.passportNo,
    dob: primary.dob,
    nationality: primary.nationality,
    notes: input.notes?.trim() || undefined,
  };
}
