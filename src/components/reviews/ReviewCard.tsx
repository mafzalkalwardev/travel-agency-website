import { StarRating } from "./StarRating";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <StarRating value={review.rating} readonly size="sm" />
      <p className="mt-3 text-sm leading-relaxed text-white/85">&ldquo;{review.comment}&rdquo;</p>
      <footer className="mt-4 border-t border-white/10 pt-3">
        <p className="font-medium text-white">{review.name}</p>
        <p className="text-xs text-gold-light">
          {[review.city, review.service].filter(Boolean).join(" · ")}
        </p>
      </footer>
    </article>
  );
}
