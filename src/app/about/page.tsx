import { createPageMetadata } from "@/lib/metadata";
import { AboutExperience } from "@/components/about/AboutExperience";
import { SITE } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Review, ReviewStats } from "@/types";

export const metadata = createPageMetadata({
  title: "About Us | Offices, Reviews & Airline Partners",
  description: `Discover ${SITE.name}, our travel services, airline partners, verified client reviews, portal access, and offices in Peshawar, Islamabad and Bannu.`,
  path: "/about/",
});

export default async function AboutPage() {
  const reviews = await getVerifiedReviews();
  const reviewStats = getReviewStats(reviews);

  return <AboutExperience reviews={reviews} reviewStats={reviewStats} />;
}

async function getVerifiedReviews(): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await createAdminClient()
      .from("reviews")
      .select("id,name,city,service,rating,comment,avatar_url,status,featured,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Review[];
  } catch {
    return [];
  }
}

function getReviewStats(reviews: Review[]): ReviewStats {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) distribution[review.rating] = (distribution[review.rating] || 0) + 1;
  return {
    count: reviews.length,
    average: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    distribution,
  };
}
