"use client";

import dynamic from "next/dynamic";

const FlightPathStory = dynamic(
  () => import("@/components/motion/FlightPathStory").then((m) => m.FlightPathStory),
  { ssr: false, loading: () => null }
);

export function DeferredFlightPathStory() {
  return <FlightPathStory />;
}
