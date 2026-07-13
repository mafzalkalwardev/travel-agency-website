import Link from "next/link";
import { loadMirrorSnapshot } from "@/lib/travelline-mirror/load";
import { getExploreCards } from "@/lib/travelline-mirror/views";
import { MirrorExploreGrid } from "@/components/travelline-mirror/MirrorExploreGrid";

export default async function TravelLineMirrorHomePage() {
  const snapshot = loadMirrorSnapshot();

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">No scrape data yet</h1>
        <p className="mt-3 text-white/60">
          Run: <code className="rounded bg-white/10 px-2 py-1">npm run scrape-mirror</code>
        </p>
      </div>
    );
  }

  const cards = getExploreCards(snapshot);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1a0a] via-[#0a0a0a] to-[#0a0a0a] px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs uppercase tracking-widest text-green-400/80">
            Trusted B2B flight booking platform
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl">
            Your Gateway to <span className="text-yellow-400">Group Travel</span>
          </h1>
          <p className="mt-4 text-white/70">
            Exclusive B2B fares · Real-time availability · Localhost mirror of Travel Line data
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/60">
            <span>{snapshot.counts.totalFlights} Group Flights</span>
            <span>{snapshot.counts.umrahPackages} Umrah Packages</span>
            <span>Synced {new Date(snapshot.scrapedAt).toLocaleString()}</span>
          </div>
        </div>
      </section>

      <MirrorExploreGrid cards={cards} />

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <h2 className="mb-4 text-lg font-semibold text-white">Compare pages</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/tl-mirror/umrah-packages/" className="rounded border border-white/20 px-3 py-2 text-blue-400 hover:bg-white/5">
            Umrah Packages ({snapshot.counts.umrahPackages})
          </Link>
          {Object.entries(snapshot.counts.byCategory).map(([cat, count]) => (
            <span key={cat} className="rounded border border-white/10 px-3 py-2 text-white/70">
              {cat}: {count}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
