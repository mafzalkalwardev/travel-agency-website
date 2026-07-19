"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ConditionalSiteChrome({
  header,
  footer,
  whatsapp,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  whatsapp: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isHome = pathname === "/" || pathname === "";

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      {/*
        Header is `fixed`, so every page needs top padding to compensate
        for the space it no longer reserves in flow — except the homepage,
        whose hero section is meant to bleed up under the transparent
        header (see Header.tsx's `transparent` state).
      */}
      <main className={cn("flex-1", !isHome && "pt-[76px]")}>{children}</main>
      {footer}
      {whatsapp}
    </>
  );
}
