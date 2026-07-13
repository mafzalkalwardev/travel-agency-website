import { ASSETS } from "@/lib/assets";
import {
  EXPLORE_CATEGORIES,
  exploreCategoryHref,
  type ExploreCategory,
} from "@/lib/travelline/categories";
import type { Destination, Ticket, TravelPackage } from "@/types";

const IMAGE_MAP: Record<ExploreCategory["imageKey"], string> = {
  umrah: ASSETS.destinations.umrah,
  umrahGroups: ASSETS.destinations.umrahGroups,
  uae: ASSETS.destinations.uae,
  oman: ASSETS.destinations.oman,
  ksa: ASSETS.destinations.ksa,
};

export function buildExploreDestinations(
  tickets: Ticket[],
  packages: TravelPackage[]
): Destination[] {
  const activePackages = packages.filter((p) => p.status === "active");
  const activeTickets = tickets.filter((t) => t.status !== "sold_out");

  return EXPLORE_CATEGORIES.map((category, index) => {
    let availableCount = 0;
    let startingPrice: number | undefined;

    if (category.kind === "umrah-packages") {
      availableCount = activePackages.length;
      startingPrice = activePackages.length
        ? Math.min(...activePackages.map((p) => p.price))
        : undefined;
    } else if (category.apiCategory) {
      const categoryTickets = activeTickets.filter(
        (t) => t.groupCategory === category.apiCategory
      );
      availableCount = categoryTickets.length;
      startingPrice = categoryTickets.length
        ? Math.min(...categoryTickets.map((t) => t.price))
        : undefined;
    }

    return {
      id: `explore-${category.slug}`,
      name: category.label,
      country: category.country,
      label: category.label,
      image: IMAGE_MAP[category.imageKey],
      slug: category.slug,
      availableCount,
      startingPrice,
      currency: "PKR",
      href: exploreCategoryHref(category),
      subtitle: category.subtitle,
      displayOrder: index,
    };
  });
}
