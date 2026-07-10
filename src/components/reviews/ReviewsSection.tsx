import { ReviewsSectionClient } from "./ReviewsSectionClient";
import { dataProvider } from "@/lib/data-provider";

interface ReviewsSectionProps {
  limit?: number;
}

export async function ReviewsSection({ limit = 6 }: ReviewsSectionProps) {
  const reviews = await dataProvider.getApprovedReviews();
  const stats = await dataProvider.getReviewStats();

  return <ReviewsSectionClient reviews={reviews} stats={stats} limit={limit} />;
}
