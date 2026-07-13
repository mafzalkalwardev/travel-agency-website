"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccountNav } from "@/components/account/AccountNav";
import { LOGO_PATH, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/base-path";

/** Each link leads to a distinct customer-facing experience. */
const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About Us" },
  { href: "/destinations/", label: "Destinations" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/contact/", label: "Contact" },
] as const;

const MOBILE_EXTRA = [
  { href: "/account/", label: "My Trips" },
  { href: "/inquiry/", label: "Book / Inquiry" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname === "" : pathname?.startsWith(href.replace(/\/$/, ""));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-navy/90 backdrop-blur-2xl transition-all duration-500",
        scrolled && "bg-navy/95 shadow-[0_16px_50px_rgba(0,0,0,.22)]"
      )}
    >
      <div className={cn("container-wide flex h-[76px] items-center justify-between gap-3 transition-all duration-500", scrolled && "lg:h-[72px]")}>
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src={assetPath(LOGO_PATH)}
            alt={SITE.name}
            width={64}
            height={64}
            className="h-12 w-12 rounded-xl object-contain ring-1 ring-white/10"
            unoptimized
            priority
          />
          <div className="hidden min-w-0 sm:block">
            <p className="font-brand text-base font-bold leading-tight text-white lg:text-lg">
              Al Qibla Air Services
            </p>
            <p className="text-xs text-gold-light lg:text-sm">Travel Smart. Travel Safe.</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-white/[.08] bg-white/[.04] p-1.5 xl:flex">
          {MAIN_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative whitespace-nowrap rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-300",
                isActive(link.href) ? "bg-gold text-navy shadow-lg shadow-gold/10" : "text-white/75 hover:bg-white/[.08] hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <AccountNav />
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "primaryGold", size: "default" }), "h-10 px-4")}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            <span className="hidden 2xl:inline">Chat on </span>WhatsApp
          </a>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-10 w-10 text-white hover:bg-white/10 xl:hidden"
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,340px)] overflow-y-auto bg-navy text-white">
              <SheetHeader>
                <SheetTitle className="text-left font-heading text-lg text-white">{SITE.name}</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1">
                {[...MAIN_NAV, ...MOBILE_EXTRA].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-white/10",
                      isActive(link.href) ? "text-gold" : "text-white/90"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
