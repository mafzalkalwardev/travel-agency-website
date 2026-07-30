import { createPageMetadata } from "@/lib/metadata";
import { AboutExperience } from "@/components/about/AboutExperience";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { PAGE_SEO } from "@/lib/seo";
import type { Review, ReviewStats } from "@/types";

export const revalidate = 60;

export const metadata = createPageMetadata({
  title: PAGE_SEO.about.title,
  description: PAGE_SEO.about.description,
  path: PAGE_SEO.about.path,
  keywords: PAGE_SEO.about.keywords,
});

export default async function AboutPage() {
  const { reviews, stats } = await getVerifiedReviews();

  return <AboutExperience reviews={reviews} reviewStats={stats} />;
}

async function getVerifiedReviews(): Promise<{ reviews: Review[]; stats: ReviewStats }> {
  const empty = { reviews: [] as Review[], stats: emptyStats() };
  if (!isSupabaseConfigured()) return empty;

  try {
    const { data, error } = await createAdminClient()
      .from("reviews")
      .select("id,name,city,service,rating,comment,avatar_url,status,featured,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !data) return empty;
    const reviews = data as Review[];
    return { reviews, stats: getReviewStats(reviews) };
  } catch {
    return empty;
  }
}

function emptyStats(): ReviewStats {
  return { count: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
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
