import { assetPath } from "@/lib/base-path";

/** Fallback hero posters when Admin → Flyers has no active images. */
export const DEFAULT_HERO_POSTERS = [
  "/assets/flyers/flyer-1.jpeg",
  "/assets/flyers/flyer-2.jpeg",
  "/assets/flyers/flyer-3.jpeg",
  "/assets/flyers/flyer-4.jpeg",
  "/assets/flyers/flyer-5.jpeg",
  "/assets/flyers/flyer-6.jpeg",
] as const;

const MAX_HERO_POSTERS = 12;

/** Resolve flyer image paths for the homepage hero (admin DB or static fallback). */
export function resolveHeroPosters(images: Array<string | null | undefined>): string[] {
  const cleaned = images
    .map((src) => (typeof src === "string" ? src.trim() : ""))
    .filter(Boolean)
    .slice(0, MAX_HERO_POSTERS)
    .map((src) => assetPath(src));

  if (cleaned.length) return cleaned;
  return DEFAULT_HERO_POSTERS.map((src) => assetPath(src));
}
