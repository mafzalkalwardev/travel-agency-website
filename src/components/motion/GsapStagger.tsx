"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface GsapStaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
}

interface GsapStaggerItemProps {
  children: ReactNode;
  className?: string;
}

/**
 * Staggered scroll reveals for direct children marked with data-gsap-item.
 * Only opacity + y — never colour or filter properties.
 */
export function GsapStagger({ children, className, stagger = 0.1, y = 24 }: GsapStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-gsap-item]", root);
        if (!items.length) return;

        gsap.set(items, { opacity: 0, y });

        ScrollTrigger.batch(items, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger,
              ease: "power2.out",
              overwrite: true,
            });
          },
          start: "top 90%",
          once: true,
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.utils.toArray<HTMLElement>("[data-gsap-item]", root).forEach((el) => {
          gsap.set(el, { opacity: 1, y: 0 });
        });
      });
    },
    { scope: ref, dependencies: [stagger, y] }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

export function GsapStaggerItem({ children, className }: GsapStaggerItemProps) {
  return (
    <div data-gsap-item className={className}>
      {children}
    </div>
  );
}
