import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  isOutboundGroupTicket,
  isReturnLegExternalId,
  PK_AIRPORT_CODES,
} from "@/lib/airport-codes";

export interface CleanupReturnTicketsResult {
  scanned: number;
  deactivated: number;
  samples: string[];
}

export async function cleanupReturnLegTickets(): Promise<CleanupReturnTicketsResult> {
  if (!isSupabaseConfigured()) {
    return { scanned: 0, deactivated: 0, samples: [] };
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("tickets")
    .select("id, external_id, from_code, to_code, flight_number, sector")
    .eq("active", true)
    .eq("source_provider", "travelline");

  if (error) throw error;

  const stale =
    rows?.filter((row) => {
      const from = String(row.from_code || "").toUpperCase();
      const to = String(row.to_code || "").toUpperCase();
      if (isReturnLegExternalId(row.external_id)) return true;
      if (!from || !to) return true;
      if (!PK_AIRPORT_CODES.has(from)) return true;
      return !isOutboundGroupTicket(from, to);
    }) ?? [];

  if (!stale.length) {
    return { scanned: rows?.length ?? 0, deactivated: 0, samples: [] };
  }

  const ids = stale.map((row) => row.id);
  const { error: updateError } = await supabase
    .from("tickets")
    .update({
      active: false,
      status: "sold_out",
      last_updated: new Date().toISOString(),
    })
    .in("id", ids);

  if (updateError) throw updateError;

  return {
    scanned: rows?.length ?? 0,
    deactivated: stale.length,
    samples: stale.slice(0, 5).map(
      (row) =>
        `${row.flight_number || "?"} ${row.from_code}→${row.to_code}${row.external_id ? ` (${row.external_id})` : ""}`
    ),
  };
}
