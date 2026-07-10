import { StarRating } from "./StarRating";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="rounded-xl border border-border/60 bg-white p-4">
      <StarRating value={review.rating} readonly size="sm" />
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">&ldquo;{review.comment}&rdquo;</p>
      <footer className="mt-3 border-t border-border/40 pt-2">
        <p className="text-sm font-medium text-navy">{review.name}</p>
        {(review.city || review.service) && (
          <p className="text-xs text-muted-foreground">
            {[review.city, review.service].filter(Boolean).join(" · ")}
          </p>
        )}
      </footer>
    </article>
  );
}
