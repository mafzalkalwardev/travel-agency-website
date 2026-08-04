import { unstable_cache } from "next/cache";
import { dataProvider } from "@/lib/data-provider";
import type { Flyer, Ticket, TravelPackage } from "@/types";

export const INVENTORY_CACHE_TAG = "inventory";

/**
 * Public marketing/inventory reads go through Next's data cache so visitors
 * do not hit Supabase on every page view. Sync jobs call revalidateTag
 * after each scrape so the cache stays within the 5-minute cadence.
 */
export const getCachedTickets = unstable_cache(
  async (): Promise<Ticket[]> => dataProvider.getTickets(),
  ["public-tickets-v1"],
  { tags: [INVENTORY_CACHE_TAG], revalidate: 600 }
);

export const getCachedUmrahPackages = unstable_cache(
  async (): Promise<TravelPackage[]> => dataProvider.getUmrahPackages(),
  ["public-umrah-v1"],
  { tags: [INVENTORY_CACHE_TAG], revalidate: 600 }
);

export const getCachedTourPackages = unstable_cache(
  async (): Promise<TravelPackage[]> => dataProvider.getTourPackages(),
  ["public-tour-v1"],
  { tags: [INVENTORY_CACHE_TAG], revalidate: 600 }
);

export const getCachedFlyers = unstable_cache(
  async (): Promise<Flyer[]> => dataProvider.getFlyers(),
  ["public-flyers-v1"],
  { tags: [INVENTORY_CACHE_TAG], revalidate: 600 }
);

export const getCachedFeaturedUmrah = unstable_cache(
  async (): Promise<TravelPackage[]> => dataProvider.getFeaturedUmrahPackages(),
  ["public-featured-umrah-v1"],
  { tags: [INVENTORY_CACHE_TAG], revalidate: 600 }
);

export const getCachedAnnouncements = unstable_cache(
  async () => dataProvider.getAnnouncements(),
  ["public-announcements-v1"],
  { tags: [INVENTORY_CACHE_TAG], revalidate: 600 }
);

export const getCachedDestinations = unstable_cache(
  async () => dataProvider.getDestinations(),
  ["public-destinations-v1"],
  { tags: [INVENTORY_CACHE_TAG], revalidate: 600 }
);
