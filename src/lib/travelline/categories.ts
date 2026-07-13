/** Travel Line group-flight categories (API `category` query param values). */
export const TRAVELLINE_GROUP_CATEGORIES = [
  "Umrah Groups",
  "U A E Oneway Groups",
  "O M A N Oneway Groups",
  "K S A Oneway Groups",
] as const;

export type TravelLineGroupCategory = (typeof TRAVELLINE_GROUP_CATEGORIES)[number];

export interface ExploreCategory {
  slug: string;
  label: string;
  apiCategory: TravelLineGroupCategory | null;
  kind: "umrah-packages" | "group-flights";
  country: string;
  imageKey: "umrah" | "umrahGroups" | "uae" | "oman" | "ksa";
  subtitle?: string;
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    slug: "umrah-packages",
    label: "Umrah Packages",
    apiCategory: null,
    kind: "umrah-packages",
    country: "Saudi Arabia",
    imageKey: "umrah",
    subtitle: "with Hotels",
  },
  {
    slug: "umrah-groups",
    label: "Umrah Groups",
    apiCategory: "Umrah Groups",
    kind: "group-flights",
    country: "Saudi Arabia",
    imageKey: "umrahGroups",
  },
  {
    slug: "uae-oneway",
    label: "UAE Oneway Groups",
    apiCategory: "U A E Oneway Groups",
    kind: "group-flights",
    country: "UAE",
    imageKey: "uae",
  },
  {
    slug: "oman-oneway",
    label: "OMAN Oneway Groups",
    apiCategory: "O M A N Oneway Groups",
    kind: "group-flights",
    country: "Oman",
    imageKey: "oman",
  },
  {
    slug: "ksa-oneway",
    label: "KSA Oneway Groups",
    apiCategory: "K S A Oneway Groups",
    kind: "group-flights",
    country: "Saudi Arabia",
    imageKey: "ksa",
  },
];

export function getExploreCategory(slug: string): ExploreCategory | undefined {
  return EXPLORE_CATEGORIES.find((c) => c.slug === slug);
}

export function groupCategorySlug(apiCategory: string | undefined | null): string | undefined {
  if (!apiCategory) return undefined;
  return EXPLORE_CATEGORIES.find((c) => c.apiCategory === apiCategory)?.slug;
}

export function exploreCategoryHref(category: ExploreCategory): string {
  if (category.kind === "umrah-packages") return "/umrah-packages/";
  return `/group-flights/${category.slug}/`;
}
