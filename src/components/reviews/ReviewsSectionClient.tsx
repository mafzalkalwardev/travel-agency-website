"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/motion/MotionSection";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import type { Review, ReviewStats } from "@/types";

interface ReviewsSectionClientProps {
  reviews: Review[];
  stats: ReviewStats;
}

export function ReviewsSectionClient({ reviews, stats }: ReviewsSectionClientProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="section-padding bg-navy-light">
      <div className="container-wide">
        <MotionSection>
          <SectionHeading
            title="What Our Clients Say"
            subtitle="Trusted by pilgrims, families, and organizations across Pakistan"
            light
          />
          {stats.count > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-6 py-4">
              <div>
                <p className="text-3xl font-bold text-gold">{stats.average.toFixed(1)}</p>
                <StarRating value={Math.round(stats.average)} readonly size="sm" />
                <p className="text-xs text-white/60">{stats.count} reviews</p>
              </div>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
          <div className="mt-8">
            {!showForm ? (
              <Button variant="primaryGold" onClick={() => setShowForm(true)}>
                Write a Review
              </Button>
            ) : (
              <div className="max-w-xl">
                <ReviewForm />
              </div>
            )}
          </div>
        </MotionSection>
      </div>
    </section>
  );
}
