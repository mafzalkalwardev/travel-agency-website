"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HeroPosterFallback } from "./HeroPosterFallback";

const Hero3DScreen = dynamic(() => import("./Hero3DScreen").then((m) => m.Hero3DScreen), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[1.75rem] bg-white/10" />,
});

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Picks the WebGL 3D screen when the device can handle it; otherwise 2D carousel.
 * Posters come from Admin → Flyers (active, display order).
 */
export function HeroPosterCarousel({ posters }: { posters: string[] }) {
  const [use3D, setUse3D] = useState(false);
  const [checked, setChecked] = useState(false);
  const [wideEnough, setWideEnough] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setWideEnough(mq.matches);
    update();
    mq.addEventListener("change", update);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setUse3D(!reducedMotion && supportsWebGL());
    setChecked(true);

    return () => mq.removeEventListener("change", update);
  }, []);

  if (!checked || !wideEnough || !posters.length) return null;
  return use3D ? <Hero3DScreen posters={posters} /> : <HeroPosterFallback posters={posters} />;
}
