"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const SiteArrivalIntro = dynamic(
  () => import("@/components/motion/SiteArrivalIntro").then((m) => m.SiteArrivalIntro),
  { ssr: false }
);

const SupportChatWidget = dynamic(
  () => import("@/components/chat/SupportChatWidget").then((m) => m.SupportChatWidget),
  { ssr: false }
);

/** Lazy-load non-critical chrome so first paint stays light. */
export function DeferredSiteExtras() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <SiteArrivalIntro />
      <SupportChatWidget />
    </>
  );
}
