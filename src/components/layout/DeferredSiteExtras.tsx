"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SiteArrivalIntro = dynamic(
  () => import("@/components/motion/SiteArrivalIntro").then((m) => m.SiteArrivalIntro),
  { ssr: false }
);

const SupportChatWidget = dynamic(
  () => import("@/components/chat/SupportChatWidget").then((m) => m.SupportChatWidget),
  { ssr: false }
);

const INTRO_STORAGE_KEY = "al-qibla-arrival-intro-seen";

/** Lazy-load non-critical chrome after first paint / idle so LCP stays light. */
export function DeferredSiteExtras() {
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    let cancelled = false;

    if (pathname === "/") {
      let seen = false;
      try {
        seen = Boolean(window.localStorage.getItem(INTRO_STORAGE_KEY));
      } catch {
        seen = false;
      }
      if (!seen && !cancelled) setShowIntro(true);
    } else {
      setShowIntro(false);
    }

    const enableChat = () => {
      if (!cancelled) setShowChat(true);
    };

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(enableChat, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(enableChat, 1500);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {showIntro ? <SiteArrivalIntro /> : null}
      {showChat ? <SupportChatWidget /> : null}
    </>
  );
}
