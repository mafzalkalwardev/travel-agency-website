import { TRAVELLINE_GROUP_CATEGORIES } from "./categories";
import type { TravelLineLiveCategory } from "./scraper";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface CategoryDiscoveryResult {
  checked: number;
  newCategories: string[];
}

/**
 * Diffs an already-fetched TravelLine category list (GET /api/categories,
 * see docs/REDESIGN.md §3.6) against our known TRAVELLINE_GROUP_CATEGORIES
 * seed list, and upserts any unrecognized category into `category_alerts`
 * for admin review — never auto-adds it to production.
 *
 * Takes the categories as a parameter rather than fetching them itself so
 * callers that already fetched them (the ticket scrape does, for ticket
 * imagery) don't pay for a second TravelLine login+request per sync.
 */
export async function recordNewCategories(
  categories: TravelLineLiveCategory[]
): Promise<CategoryDiscoveryResult> {
  const known = new Set<string>(TRAVELLINE_GROUP_CATEGORIES);
  const unknown = categories.filter((c) => c.name && !known.has(c.name));

  if (unknown.length && isSupabaseConfigured()) {
    const supabase = createAdminClient();
    for (const category of unknown) {
      await supabase
        .from("category_alerts")
        .upsert(
          {
            category_name: category.name,
            image_url: category.imageUrl ?? null,
            available_groups_count: category.availableGroupsCount ?? null,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "category_name", ignoreDuplicates: false }
        );
    }
  }

  return { checked: categories.length, newCategories: unknown.map((c) => c.name) };
}
