import { getTravelLineConfig } from "@/lib/travelline/env";
import { isTravelLineSyncEnabled } from "@/lib/travelline/env";
import {
  announcementsFromUmrahItems,
  mapTravelLineUmrahApiItem,
  mapPromoToAnnouncement,
  mapPromoToFlyer,
} from "@/lib/travelline/mappers";
import { scrapeTravelLineUmrahItems } from "@/lib/travelline/scraper";
import {
  upsertPromos,
  upsertTourPackages,
  upsertUmrahPackages,
  type UpsertTicketsResult,
} from "@/lib/sync/upsert-inventory";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ensureUsableImageUrl, FALLBACK_IMAGES } from "@/lib/image-utils";
import type { SyncChange } from "@/lib/tickets/providers/types";

export interface PackageSyncResult {
  provider: string;
  status: "success" | "partial" | "failed";
  umrahProcessed: number;
  toursProcessed: number;
  promosProcessed: number;
  umrahCreated?: number;
  umrahUpdated?: number;
  umrahDeactivated?: number;
  toursCreated?: number;
  toursUpdated?: number;
  toursDeactivated?: number;
  changes?: SyncChange[];
  message?: string;
}

export async function syncTravelLinePackages(): Promise<PackageSyncResult> {
  if (!isTravelLineSyncEnabled()) {
    return {
      provider: "travelline",
      status: "failed",
      umrahProcessed: 0,
      toursProcessed: 0,
      promosProcessed: 0,
      changes: [],
      message: "Supplier sync not enabled",
    };
  }

  try {
    const { markupPercent } = getTravelLineConfig();
    // Prefer the authenticated HTTP client path first — same source TravelLine
    // uses for package inventory — then fall back to the scraper.
    let items: Awaited<ReturnType<typeof scrapeTravelLineUmrahItems>> = [];
    try {
      const { TravelLineClient } = await import("@/lib/travelline/client");
      items = await new TravelLineClient().fetchUmrahApiItems();
    } catch {
      items = await scrapeTravelLineUmrahItems();
    }
    if (!items.length) {
      items = await scrapeTravelLineUmrahItems();
    }
    const umrah = items.map((item) => mapTravelLineUmrahApiItem(item, markupPercent));
    const tours: Record<string, unknown>[] = [];
    const promos = announcementsFromUmrahItems(items).map((a) => ({
      id: a.source_external_id,
      title: a.message,
      message: a.message,
      active: a.active,
    }));
    const umrahRows = await verifyPackageImages(umrah as Record<string, unknown>[], "umrah");
    const tourRows = await verifyPackageImages(tours as Record<string, unknown>[], "tour");

    let umrahResult: UpsertTicketsResult = { created: 0, updated: 0, deactivated: 0, skipped: 0, changes: [] };
    let tourResult: UpsertTicketsResult = { created: 0, updated: 0, deactivated: 0, skipped: 0, changes: [] };

    if (isSupabaseConfigured()) {
      umrahResult = await upsertUmrahPackages(umrahRows);
      tourResult = await upsertTourPackages(tourRows);
      if (promos.length) {
        const flyerRows = await verifyPromoImages(promos.map((p, i) => mapPromoToFlyer(p, i)));
        const announcementRows = promos.map((p, i) => mapPromoToAnnouncement(p, i));
        await upsertPromos(flyerRows, announcementRows);
      }
    }

    return {
      provider: "travelline",
      status: umrah.length || tours.length || promos.length ? "success" : "partial",
      umrahProcessed: umrah.length,
      toursProcessed: tours.length,
      promosProcessed: promos.length,
      umrahCreated: umrahResult.created,
      umrahUpdated: umrahResult.updated,
      umrahDeactivated: umrahResult.deactivated,
      toursCreated: tourResult.created,
      toursUpdated: tourResult.updated,
      toursDeactivated: tourResult.deactivated,
      changes: [...umrahResult.changes, ...tourResult.changes],
      message: `Synced ${umrah.length} umrah, ${tours.length} tours, ${promos.length} promos (${umrahResult.created + tourResult.created} new, ${umrahResult.updated + tourResult.updated} changed, ${umrahResult.deactivated + tourResult.deactivated} sold out, ${(umrahResult.skipped || 0) + (tourResult.skipped || 0)} incomplete skipped)`,
    };
  } catch (e) {
    const message =
      e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
        ? (e as { message: string }).message
        : e instanceof Error
          ? e.message
          : "Package sync failed";
    return {
      provider: "travelline",
      status: "failed",
      umrahProcessed: 0,
      toursProcessed: 0,
      promosProcessed: 0,
      changes: [],
      message,
    };
  }
}

async function verifyPackageImages(rows: Record<string, unknown>[], type: "umrah" | "tour") {
  const fallback = type === "umrah" ? FALLBACK_IMAGES.umrah : FALLBACK_IMAGES.tour;
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      image_url: await ensureUsableImageUrl(row.image_url, fallback),
    }))
  );
}

async function verifyPromoImages(rows: Record<string, unknown>[]) {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      image_url: await ensureUsableImageUrl(row.image_url, FALLBACK_IMAGES.flyer),
    }))
  );
}
