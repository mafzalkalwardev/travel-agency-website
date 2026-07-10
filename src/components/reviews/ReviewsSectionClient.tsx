"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MotionSection } from "@/components/motion/MotionSection";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { Button } from "@/components/ui/button";
import type { Review, ReviewStats } from "@/types";

interface ReviewsSectionClientProps {
  reviews: Review[];
  stats: ReviewStats;
  limit?: number;
}

export function ReviewsSectionClient({ reviews, stats, limit = 6 }: ReviewsSectionClientProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="section-padding bg-light-bg">
      <div className="container-wide">
        <MotionSection>
          <SectionHeading
            title="What Our Clients Say"
            subtitle={stats.count > 0 ? `${stats.average.toFixed(1)} ★ from ${stats.count} reviews` : "Trusted by pilgrims and travelers across Pakistan"}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, limit).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
          <div className="mt-6">
            {!showForm ? (
              <Button variant="outlineDark" onClick={() => setShowForm(true)}>
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
