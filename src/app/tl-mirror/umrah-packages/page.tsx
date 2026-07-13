import { loadMirrorSnapshot } from "@/lib/travelline-mirror/load";
import { getUmrahPackages } from "@/lib/travelline-mirror/views";
import { MirrorUmrahPackagesClient } from "@/components/travelline-mirror/MirrorUmrahPackagesClient";

export default async function MirrorUmrahPackagesPage() {
  const snapshot = loadMirrorSnapshot();
  if (!snapshot) {
    return (
      <div className="px-4 py-20 text-center text-white/60">
        Run <code className="text-white">npm run scrape-mirror</code> first
      </div>
    );
  }

  const packages = getUmrahPackages(snapshot);

  return <MirrorUmrahPackagesClient packages={packages} scrapedAt={snapshot.scrapedAt} />;
}
