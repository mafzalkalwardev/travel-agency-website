"use client";

import { useState } from "react";
import Image from "next/image";
import { Plane } from "lucide-react";
import { airlineLogoPath, resolveAirlineCode, resolveAirlineName } from "@/data/airlines";
import { assetPath } from "@/lib/base-path";
import { cn } from "@/lib/utils";

interface AirlineLogoProps {
  code: string;
  name: string;
  /** Ignored for known IATA codes — always use local curated PNGs. */
  logo?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: { box: "h-12 w-12", img: 40, pad: "p-1" },
  md: { box: "h-16 w-16", img: 52, pad: "p-1.5" },
  lg: { box: "h-20 w-20", img: 64, pad: "p-2" },
  xl: { box: "h-[6.75rem] w-[6.75rem]", img: 112, pad: "p-1" },
};

export function AirlineLogo({ code, name, logo, size = "md", className }: AirlineLogoProps) {
  const [failed, setFailed] = useState(false);
  const resolvedCode = resolveAirlineCode({ code, name });
  const displayName = resolveAirlineName(resolvedCode, name);
  // Prefer local curated assets so stale CDN marks (Primera Air, etc.) never surface.
  const logoPath =
    resolvedCode !== "XX" ? airlineLogoPath(resolvedCode) : logo || airlineLogoPath(code);
  const s = sizes[size];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-white shadow-sm transition-shadow hover:shadow-md",
        s.box,
        className
      )}
      title={displayName}
    >
      {!failed ? (
        <Image
          src={assetPath(logoPath)}
          alt={`${displayName} logo`}
          width={s.img}
          height={s.img}
          className={cn("h-full w-full object-contain", s.pad)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-navy/5 to-royal/10 p-1">
          <Plane className="h-4 w-4 text-royal/50" />
          <span className="text-[10px] font-bold text-navy/80">{resolvedCode}</span>
        </div>
      )}
    </div>
  );
}
