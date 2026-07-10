import { ReviewsSectionClient } from "./ReviewsSectionClient";
import { dataProvider } from "@/lib/data-provider";

export async function ReviewsSection() {
  const reviews = await dataProvider.getApprovedReviews();
  const stats = await dataProvider.getReviewStats();

  return <ReviewsSectionClient reviews={reviews} stats={stats} />;
}
