"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HeroPosterFallback } from "./HeroPosterFallback";

const Hero3DScreen = dynamic(() => import("./Hero3DScreen").then((m) => m.Hero3DScreen), {
  ssr: false,
  loading: () => <HeroPosterFallback />,
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
 * Picks the real WebGL "3D screen" hero when the device can reasonably
 * handle it, and falls back to a plain 2D carousel of the same posters
 * otherwise (no WebGL support, or the viewer prefers reduced motion) —
 * see docs/REDESIGN.md §7's perf-risk note for why this fallback exists.
 *
 * The parent only shows this panel at the `lg` breakpoint (CSS
 * `hidden lg:block`), but a CSS-hidden element still mounts and runs —
 * this component checks viewport width itself and renders nothing at all
 * below `lg` so a phone never pays for an invisible WebGL context.
 */
export function HeroPosterCarousel() {
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

  if (!checked || !wideEnough) return null;
  return use3D ? <Hero3DScreen /> : <HeroPosterFallback />;
}
