import Link from "next/link";
import Image from "next/image";
import type { MirrorExploreCard } from "@/lib/travelline-mirror/types";

interface MirrorExploreGridProps {
  cards: MirrorExploreCard[];
}

export function MirrorExploreGrid({ cards }: MirrorExploreGridProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">Quick Access</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Explore by Destination</h2>
          <p className="mt-1 text-sm text-white/60">Select a destination to browse available group flights</p>
        </div>
        <Link href="/tl-mirror/" className="text-sm text-blue-400 hover:underline">
          View All →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.slug}
            href={card.href}
            className="group relative overflow-hidden rounded-xl border border-white/10"
          >
            <div className="relative aspect-[4/5]">
              <Image
                src={card.image}
                alt={card.label}
                fill
                sizes="(max-width: 640px) 50vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              {card.slug === "umrah-packages" && (
                <span className="absolute left-3 top-3 rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-semibold">
                  2026 SEASON
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="font-bold text-white">{card.label}</h3>
                {card.subtitle ? (
                  <p className="mt-1 text-xs text-amber-300">🛏 {card.subtitle}</p>
                ) : (
                  <p className="mt-1 text-xs text-white/70">{card.count} flights</p>
                )}
                <span className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/10 transition group-hover:bg-green-600">
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
