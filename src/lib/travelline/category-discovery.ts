import { loginViaHttp, fetchLiveCategories } from "./scraper";
import { TRAVELLINE_GROUP_CATEGORIES } from "./categories";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface CategoryDiscoveryResult {
  checked: number;
  newCategories: string[];
}

/**
 * Diffs TravelLine's live category list (GET /api/categories, see
 * docs/REDESIGN.md §3.6) against our known TRAVELLINE_GROUP_CATEGORIES
 * seed list, and upserts any unrecognized category into `category_alerts`
 * for admin review — never auto-adds it to production. Safe to call on
 * every sync; it's a lightweight read plus an upsert only when something
 * new shows up.
 */
export async function checkForNewCategories(): Promise<CategoryDiscoveryResult> {
  const known = new Set<string>(TRAVELLINE_GROUP_CATEGORIES);

  const cookie = await loginViaHttp();
  if (!cookie) return { checked: 0, newCategories: [] };

  const live = await fetchLiveCategories(cookie);
  const unknown = live.filter((c) => c.name && !known.has(c.name));

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

  return { checked: live.length, newCategories: unknown.map((c) => c.name) };
}
