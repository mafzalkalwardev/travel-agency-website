import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { writeLocalTickets } from "@/lib/sync/local-inventory";
import type { NormalizedTicket, SyncChange } from "@/lib/tickets/providers/types";
import { randomUUID } from "crypto";
import { isOutboundGroupTicket, isReturnLegExternalId } from "@/lib/airport-codes";

const PROVIDER = "travelline";
const BATCH_SIZE = 200;

export interface UpsertTicketsResult {
  created: number;
  updated: number;
  deactivated: number;
  skipped?: number;
  changes: SyncChange[];
}

export async function upsertTickets(
  tickets: NormalizedTicket[],
  provider = PROVIDER
): Promise<UpsertTicketsResult> {
  // Travel Line can return the same group flight twice across categories.
  // One upsert/insert batch cannot touch the same conflict key twice.
  const deduped = dedupeByExternalId(tickets, (t) => t.externalId);
  const validTickets = deduped.filter(
    (t) => isCompleteTicket(t) && isOutboundGroupTicket(t.from, t.to) && !isReturnLegExternalId(t.externalId)
  );
  const skipped = tickets.length - validTickets.length;

  if (!isSupabaseConfigured()) {
    writeLocalTickets(validTickets, provider);
    return { created: validTickets.length, updated: 0, deactivated: 0, skipped, changes: [] };
  }

  const supabase = createAdminClient();
  const { error: probeError } = await supabase.from("tickets").select("id").limit(1);
  if (probeError?.message?.includes("Could not find the table")) {
    writeLocalTickets(validTickets, provider);
    return { created: validTickets.length, updated: 0, deactivated: 0, skipped, changes: [] };
  }

  const existingRows = await fetchAllRows(supabase, "tickets", provider);
  const existingByExternalId = new Map(
    existingRows
      .filter((row) => row.external_id)
      .map((row) => [String(row.external_id), row] as const)
  );

  let created = 0;
  let updated = 0;
  const changes: SyncChange[] = [];
  const seenIds = new Set<string>();
  const rowsToInsert: Record<string, unknown>[] = [];
  const rowsToUpdate: Record<string, unknown>[] = [];

  const todayPkt = pakistanToday();
  for (const t of validTickets) {
    seenIds.add(t.externalId);
    const isDeparted = Boolean(t.date && t.date < todayPkt);
    const row = {
      external_id: t.externalId,
      source_provider: provider,
      airline: t.airline,
      airline_code: t.airlineCode,
      flight_number: t.flightNumber,
      from_code: t.from,
      from_city: t.fromCity,
      to_code: t.to,
      to_city: t.toCity,
      sector: t.sector,
      destination: t.destination,
      departure_date: t.date,
      departure_time: t.departureTime,
      arrival_time: t.arrivalTime,
      duration: t.duration,
      price: t.price,
      currency: t.currency,
      seats_left: t.seatsLeft,
      status: isDeparted ? "sold_out" : t.status,
      baggage: t.baggage ?? null,
      meal: t.meal ?? null,
      trip_type: t.tripType ?? "oneway",
      is_direct: t.isDirect ?? true,
      group_category: t.groupCategory ?? null,
      aircraft: t.aircraft ?? null,
      image_url: t.imageUrl ?? null,
      // Never keep a past-departure flight bookable, even if TravelLine still lists seats.
      active: !isDeparted && t.status !== "sold_out" && t.status !== "cancelled",
      last_updated: new Date().toISOString(),
      raw_payload: t,
    };

    const existing = existingByExternalId.get(t.externalId);
    if (existing) {
      const fieldChanges = diffFields(existing, row, ticketDiffFields);
      if (Object.keys(fieldChanges).length) {
        updated++;
        rowsToUpdate.push({ ...row, id: existing.id });
        changes.push({
          provider,
          entityType: "ticket",
          entityId: String(existing.id),
          externalId: t.externalId,
          changeType: "updated",
          fieldChanges,
        });
      }
    } else {
      created++;
      rowsToInsert.push({ ...row, id: randomUUID() });
      changes.push({
        provider,
        entityType: "ticket",
        externalId: t.externalId,
        changeType: "created",
        newValue: row,
      });
    }
  }

  await batchInsert(supabase, "tickets", rowsToInsert);
  await batchUpdate(supabase, "tickets", rowsToUpdate);

  let deactivated = 0;
  if (seenIds.size && skipped === 0) {
    const staleRows = existingRows.filter(
      (row) => row.active === true && row.external_id && !seenIds.has(String(row.external_id))
    );
    const staleIds = staleRows.map((row) => row.id);
    if (staleIds.length) {
      await supabase
        .from("tickets")
        .update({ active: false, status: "sold_out", last_updated: new Date().toISOString() })
        .in("id", staleIds);
      deactivated = staleIds.length;
      for (const row of staleRows) {
        changes.push({
          provider,
          entityType: "ticket",
          entityId: String(row.id),
          externalId: row.external_id ? String(row.external_id) : undefined,
          changeType: "deactivated",
          fieldChanges: {
            active: { old: row.active, new: false },
            status: { old: row.status, new: "sold_out" },
          },
          oldValue: row,
        });
      }
    }
  }

  const departedDeactivated = await deactivateDepartedTickets(supabase);

  return { created, updated, deactivated: deactivated + departedDeactivated, skipped, changes };
}

/**
 * Defense-in-depth against stale/departed flights staying bookable: the
 * seenIds-based deactivation above only catches a ticket once it *drops
 * out* of a fresh sync batch, so any gap in sync cadence (e.g. the 4-day
 * cron outage found 2026-07-17, see docs/REDESIGN.md) leaves already-
 * departed flights visible and "bookable" until the next sync happens to
 * omit them. This runs on every sync regardless of gaps and hides any
 * still-active ticket whose departure date has already passed.
 */
async function deactivateDepartedTickets(
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  // Pakistan time (UTC+5), not raw UTC — flights are PKT-scheduled, and
  // comparing against UTC's date could flag/miss departures near
  // midnight depending on which side of the UTC/PKT day boundary the
  // sync happens to run in.
  const today = pakistanToday();
  const { data: departedRows, error } = await supabase
    .from("tickets")
    .select("id")
    .eq("active", true)
    .lt("departure_date", today);

  if (error) {
    console.error("[sync] deactivateDepartedTickets query failed:", error.message);
    return 0;
  }

  const ids = (departedRows ?? []).map((r) => r.id);
  if (!ids.length) return 0;

  await supabase
    .from("tickets")
    .update({
      active: false,
      status: "sold_out",
      last_updated: new Date().toISOString(),
    })
    .in("id", ids);
  return ids.length;
}

function pakistanToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
}

export async function upsertUmrahPackages(
  rows: Record<string, unknown>[],
  provider = PROVIDER
): Promise<UpsertTicketsResult> {
  return upsertPackageRows("umrah_packages", "umrah_package", rows, provider);
}

export async function upsertTourPackages(
  rows: Record<string, unknown>[],
  provider = PROVIDER
): Promise<UpsertTicketsResult> {
  return upsertPackageRows("tour_packages", "tour_package", rows, provider);
}

function isCompleteTicket(ticket: NormalizedTicket): boolean {
  return Boolean(
    ticket.externalId &&
      ticket.airline &&
      ticket.airline !== "Unknown" &&
      ticket.flightNumber &&
      ticket.from &&
      ticket.to &&
      ticket.date &&
      Number.isFinite(ticket.price) &&
      ticket.price > 0 &&
      Number.isFinite(ticket.seatsLeft)
  );
}

function isCompletePackageRow(row: Record<string, unknown>): boolean {
  return Boolean(
    row.external_id &&
      row.title &&
      row.slug &&
      row.duration &&
      row.image_url &&
      Number.isFinite(Number(row.price)) &&
      Number(row.price) > 0
  );
}

async function deactivateStale(
  supabase: ReturnType<typeof createAdminClient>,
  table: "umrah_packages" | "tour_packages",
  provider: string,
  seenIds: string[]
): Promise<{ deactivated: number; changes: SyncChange[] }> {
  if (!seenIds.length) return { deactivated: 0, changes: [] };
  const { data: activeRows } = await supabase
    .from(table)
    .select("id, external_id, status, price, seats_left")
    .eq("source_provider", provider)
    .eq("status", "active");

  const staleIds = (activeRows || [])
    .filter((r) => r.external_id && !seenIds.includes(r.external_id))
    .map((r) => r.id);

  if (!staleIds.length) return { deactivated: 0, changes: [] };
  await supabase.from(table).update({ status: "sold_out" }).in("id", staleIds);
  const entityType = table === "umrah_packages" ? "umrah_package" : "tour_package";
  return {
    deactivated: staleIds.length,
    changes: (activeRows || [])
      .filter((row) => staleIds.includes(row.id))
      .map((row) => ({
        provider,
        entityType,
        entityId: row.id,
        externalId: row.external_id,
        changeType: "deactivated" as const,
        fieldChanges: { status: { old: row.status, new: "sold_out" } },
        oldValue: row,
      })),
  };
}

async function upsertPackageRows(
  table: "umrah_packages" | "tour_packages",
  entityType: "umrah_package" | "tour_package",
  rows: Record<string, unknown>[],
  provider: string
): Promise<UpsertTicketsResult> {
  const deduped = dedupeByExternalId(rows, (row) => String(row.external_id || ""));
  const validRows = deduped.filter((row) => isCompletePackageRow(row));
  const skipped = rows.length - validRows.length;
  const supabase = createAdminClient();
  const existingRows = await fetchAllRows(supabase, table, provider);

  const existingByExternalId = new Map(
    existingRows
      .filter((row) => row.external_id)
      .map((row) => [String(row.external_id), row] as const)
  );

  let created = 0;
  let updated = 0;
  const changes: SyncChange[] = [];
  const seenIds = new Set<string>();
  const rowsToUpsert: Record<string, unknown>[] = [];

  for (const row of validRows) {
    const externalId = String(row.external_id);
    seenIds.add(externalId);
    const existing = existingByExternalId.get(externalId);
    const withId = { ...row, id: existing?.id ?? randomUUID() };

    if (existing) {
      const fieldChanges = diffFields(existing, withId, packageDiffFields);
      if (Object.keys(fieldChanges).length) {
        updated++;
        rowsToUpsert.push(withId);
        changes.push({
          provider,
          entityType,
          entityId: String(existing.id),
          externalId,
          changeType: "updated",
          fieldChanges,
        });
      }
    } else {
      created++;
      rowsToUpsert.push(withId);
      changes.push({
        provider,
        entityType,
        entityId: String(withId.id),
        externalId,
        changeType: "created",
        newValue: withId,
      });
    }
  }

  await batchUpsert(supabase, table, rowsToUpsert);

  const stale =
    skipped === 0 ? await deactivateStale(supabase, table, provider, Array.from(seenIds)) : { deactivated: 0, changes: [] };
  changes.push(...stale.changes);
  return { created, updated, deactivated: stale.deactivated, skipped, changes };
}

async function batchInsert(
  supabase: ReturnType<typeof createAdminClient>,
  table: "tickets" | "umrah_packages" | "tour_packages",
  rows: Record<string, unknown>[]
) {
  if (!rows.length) return;
  // Collapse duplicate external_ids inside a batch (last wins).
  const unique = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const key = String(row.external_id || row.id || "");
    if (!key) continue;
    unique.set(key, row);
  }
  const uniqueRows = Array.from(unique.values());
  for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
    const batch = uniqueRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(batch);
    if (error) throw error;
  }
}

/** PostgREST defaults to max 1000 rows — paginate so sync never misses existing ids. */
async function fetchAllRows(
  supabase: ReturnType<typeof createAdminClient>,
  table: "tickets" | "umrah_packages" | "tour_packages",
  provider: string
): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const all: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("source_provider", provider)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as Record<string, unknown>[]));
    if (data.length < pageSize) break;
  }
  return all;
}

async function batchUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  table: "tickets" | "umrah_packages" | "tour_packages",
  rows: Record<string, unknown>[]
) {
  for (const row of rows) {
    const { id, ...payload } = row;
    if (!id) continue;
    const { error } = await supabase.from(table).update(payload).eq("id", id);
    if (error) throw error;
  }
}

async function batchUpsert(
  supabase: ReturnType<typeof createAdminClient>,
  table: "tickets" | "umrah_packages" | "tour_packages",
  rows: Record<string, unknown>[]
) {
  if (!rows.length) return;
  // Defense: collapse any remaining duplicate primary keys in a batch.
  const uniqueById = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const id = String(row.id ?? "");
    if (!id) continue;
    uniqueById.set(id, row);
  }
  const uniqueRows = Array.from(uniqueById.values());

  for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
    const batch = uniqueRows.slice(i, i + BATCH_SIZE).map((row) => {
      // Never send an explicit null id — Postgres rejects it even when the
      // column has a default. New rows must carry a generated UUID.
      if (row.id == null) {
        const { id: _omit, ...rest } = row;
        return { ...rest, id: randomUUID() };
      }
      return row;
    });
    const { error } = await supabase.from(table).upsert(batch, { onConflict: "id" });
    if (error) throw error;
  }
}

function dedupeByExternalId<T>(items: T[], getId: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const id = getId(item);
    if (!id) continue;
    map.set(id, item); // last occurrence wins
  }
  return Array.from(map.values());
}

const ticketDiffFields = [
  "airline",
  "airline_code",
  "flight_number",
  "from_code",
  "from_city",
  "to_code",
  "to_city",
  "sector",
  "destination",
  "departure_date",
  "departure_time",
  "arrival_time",
  "duration",
  "price",
  "currency",
  "seats_left",
  "status",
  "baggage",
  "meal",
  "trip_type",
  "is_direct",
  "group_category",
  "aircraft",
  "image_url",
  "active",
  // Intentionally omit raw_payload — TravelLine refreshes supplierUpdatedAt
  // on every scrape, which previously marked ALL tickets as "changed" every
  // sync, flooded sync_changes, and made Admin "Sync Now" hang/timeout.
];

const packageDiffFields = [
  "title",
  "slug",
  "package_code",
  "category",
  "destination",
  "price",
  "currency",
  "duration",
  "departure_city",
  "airline",
  "hotel_makkah",
  "hotel_madinah",
  "distance_from_haram",
  "transport",
  "visa",
  "ziyarat",
  "seats_left",
  "image_url",
  "featured",
  "status",
];

function normalizeComparable(value: unknown) {
  if (value === undefined) return null;
  if (typeof value === "number") return Number(value);
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}

function diffFields(
  existing: Record<string, unknown>,
  next: Record<string, unknown>,
  fields: string[]
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const field of fields) {
    const oldValue = normalizeComparable(existing[field]);
    const newValue = normalizeComparable(next[field]);
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[field] = { old: existing[field] ?? null, new: next[field] ?? null };
    }
  }
  return changes;
}

export async function upsertPromos(
  flyers: Record<string, unknown>[],
  announcements: Record<string, unknown>[]
): Promise<void> {
  const supabase = createAdminClient();

  for (const [i, flyer] of flyers.entries()) {
    const extId = String(flyer.source_external_id ?? i);
    const { data: existing } = await supabase
      .from("flyers")
      .select("id")
      .eq("title", flyer.title)
      .maybeSingle();
    const payload = {
      title: flyer.title,
      category: flyer.category || "announcement",
      image_url: flyer.image_url,
      link: flyer.link ?? null,
      display_order: flyer.display_order ?? i,
      active: flyer.active !== false,
    };
    if (existing) await supabase.from("flyers").update(payload).eq("id", existing.id);
    else await supabase.from("flyers").insert(payload);
    void extId;
  }

  for (const [i, ann] of announcements.entries()) {
    const { data: existing } = await supabase
      .from("announcements")
      .select("id")
      .eq("message", ann.message)
      .maybeSingle();
    const payload = {
      message: ann.message,
      priority: ann.priority ?? i + 1,
      active: ann.active !== false,
    };
    if (existing) await supabase.from("announcements").update(payload).eq("id", existing.id);
    else await supabase.from("announcements").insert(payload);
  }
}
