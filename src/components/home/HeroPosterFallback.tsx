"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { assetPath } from "@/lib/base-path";

const POSTER_COUNT = 6;
const POSTERS = Array.from({ length: POSTER_COUNT }, (_, i) => `/assets/flyers/flyer-${i + 1}.jpeg`);

/**
 * Lightweight 2D carousel fallback for the hero poster screen — used when
 * WebGL is unavailable or the viewer prefers reduced motion. See
 * HeroPosterCarousel.tsx for the capability check that picks this over
 * Hero3DScreen.
 */
export function HeroPosterFallback() {
  const autoplay = useRef(Autoplay({ delay: 4500, stopOnInteraction: false }));
  const [emblaRef] = useEmblaCarousel({ loop: true }, [autoplay.current]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] border border-white/10 shadow-2xl shadow-black/40">
      <div className="h-full" ref={emblaRef}>
        <div className="flex h-full">
          {POSTERS.map((src, i) => (
            <div key={src} className="relative min-w-0 shrink-0 grow-0 basis-full">
              <Image
                src={assetPath(src)}
                alt={`Al Qibla offer poster ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 0px, 380px"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
