import { unstable_cache } from "next/cache";

export type InventoryMirror = {
  updatedAt: string;
  tickets: Record<string, unknown>[];
  umrahPackages: Record<string, unknown>[];
  tourPackages: Record<string, unknown>[];
  flyers: Record<string, unknown>[];
};

function mirrorUrl() {
  return (
    process.env.INVENTORY_MIRROR_URL ||
    "https://raw.githubusercontent.com/mafzalkalwardev/travel-agency-website/inventory-cache/public-inventory.json"
  );
}

/**
 * Compact inventory JSON hosted on GitHub (CDN-friendly). Public pages prefer
 * this over live Supabase to stay under Fair Use egress.
 */
export const getInventoryMirror = unstable_cache(
  async (): Promise<InventoryMirror | null> => {
    try {
      const res = await fetch(mirrorUrl(), {
        headers: { Accept: "application/json" },
        // Avoid Next packing this into the Supabase path.
        cache: "no-store",
      });
      if (!res.ok) return null;
      const json = (await res.json()) as InventoryMirror;
      if (!json?.tickets || !Array.isArray(json.tickets)) return null;
      return json;
    } catch {
      return null;
    }
  },
  ["inventory-mirror-v1"],
  { tags: ["inventory"], revalidate: 600 }
);
