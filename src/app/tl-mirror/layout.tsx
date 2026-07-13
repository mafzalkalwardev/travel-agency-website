import type { Metadata } from "next";
import { MirrorHeader } from "@/components/travelline-mirror/MirrorHeader";
import { MirrorPromoBar } from "@/components/travelline-mirror/MirrorPromoBar";
import "./mirror.css";

export const metadata: Metadata = {
  title: "Travel Line Mirror",
  description: "Local mirror of Travel Line inventory for side-by-side comparison",
};

export default function TravelLineMirrorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tl-mirror min-h-screen bg-[#0a0a0a] text-white">
      <MirrorHeader />
      <MirrorPromoBar />
      <main>{children}</main>
      <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/50">
        Travel Line localhost mirror · scraped inventory only · compare with travellinetour.com
      </footer>
    </div>
  );
}
