"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useState } from "react";

/**
 * Lightweight 2D carousel fallback for the hero poster screen — used when
 * WebGL is unavailable or the viewer prefers reduced motion.
 */
export function HeroPosterFallback({ posters }: { posters: string[] }) {
  const [autoplay] = useState(() => Autoplay({ delay: 4500, stopOnInteraction: false }));
  const [emblaRef] = useEmblaCarousel({ loop: posters.length > 1 }, [autoplay]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] border border-white/10 shadow-2xl shadow-black/40">
      <div className="h-full" ref={emblaRef}>
        <div className="flex h-full">
          {posters.map((src, i) => (
            <div key={`${src}-${i}`} className="relative min-w-0 shrink-0 grow-0 basis-full">
              <Image
                src={src}
                alt={`Al Qibla offer poster ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 0px, 380px"
                className="object-cover"
                priority={i === 0}
                unoptimized={/^https?:\/\//i.test(src)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
