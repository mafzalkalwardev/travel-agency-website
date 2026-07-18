"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "hero" | "section" | "subtle";
type Direction = "left-right" | "right-left";

interface AnimatedFlightPathProps {
  className?: string;
  variant?: Variant;
  direction?: Direction;
  speed?: number;
  showDots?: boolean;
  color?: string;
}

const paths: Record<Direction, string> = {
  "left-right": "M 0 60 Q 120 20 240 50 T 480 40 T 720 55",
  "right-left": "M 720 55 Q 600 15 480 45 T 240 35 T 0 50",
};

export function AnimatedFlightPath({
  className,
  variant = "section",
  direction = "left-right",
  speed = variant === "hero" ? 6 : 8,
  showDots = true,
  color = "#D6A84F",
}: AnimatedFlightPathProps) {
  const reduced = useReducedMotion();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const opacity =
    variant === "hero" ? 0.35 : variant === "section" ? 0.25 : 0.15;

  if (reduced || (mobile && variant === "hero")) {
    return (
      <svg
        className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
        viewBox="0 0 720 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={paths[direction]}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="6 10"
          opacity={opacity}
        />
      </svg>
    );
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 720 80"
        preserveAspectRatio="none"
      >
        <motion.path
          d={paths[direction]}
          fill="none"
          stroke={color}
          strokeWidth={variant === "hero" ? 2 : 1.5}
          strokeDasharray="6 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity }}
          transition={{ duration: variant === "hero" ? 1.7 : 2.4, ease: "easeInOut" }}
        />
        {showDots && (
          <>
            <circle cx={direction === "left-right" ? 0 : 720} cy={55} r="3" fill={color} opacity={0.6} />
            <circle cx={direction === "left-right" ? 720 : 0} cy={50} r="3" fill={color} opacity={0.6} />
          </>
        )}
      </svg>
      <motion.div
        className="absolute top-0 left-0"
        animate={{
          offsetDistance: ["0%", "100%"],
        }}
        style={{
          offsetPath: `path('${paths[direction]}')`,
          offsetRotate: "auto",
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Plane className="h-4 w-4" style={{ color }} fill="currentColor" />
      </motion.div>
    </div>
  );
}
