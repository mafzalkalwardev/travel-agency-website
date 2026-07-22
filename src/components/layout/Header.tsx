"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, MessageSquareText, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccountNav } from "@/components/account/AccountNav";
import { LOGO_NAV_PATH, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/base-path";

const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About" },
  { href: "/available-tickets/", label: "Tickets" },
  { href: "/umrah-packages/", label: "Umrah" },
  { href: "/destinations/", label: "Destinations" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/contact/", label: "Contact" },
] as const;

const MOBILE_EXTRA = [
  { href: "/account/", label: "My Trips" },
  { href: "/inquiry/", label: "Book / Inquiry" },
  { href: "/portal/", label: "Portal" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/" || pathname === "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname === ""
      : pathname?.startsWith(href.replace(/\/$/, ""));

  const transparent = isHome && !scrolled;

  function openSupportChat() {
    window.dispatchEvent(new CustomEvent("alqibla:open-support-chat"));
    setOpen(false);
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        transparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-white/10 bg-navy/85 shadow-[0_12px_40px_rgba(0,0,0,.28)] backdrop-blur-2xl"
      )}
    >
      <div className="container-wide">
        <div
          className={cn(
            "mt-3 flex h-[64px] items-center justify-between gap-4 rounded-2xl px-3 transition-all duration-500 sm:px-4 lg:h-[68px]",
            transparent
              ? "border border-white/15 bg-white/8 shadow-[0_8px_32px_rgba(0,0,0,.12)] backdrop-blur-xl"
              : "border border-white/10 bg-white/[0.04]"
          )}
        >
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <Image
              src={assetPath(LOGO_NAV_PATH)}
              alt={SITE.name}
              width={56}
              height={56}
              className="h-11 w-11 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,.35)] transition group-hover:scale-[1.03] sm:h-12 sm:w-12"
              unoptimized
              priority
            />
            <div className="hidden min-w-0 md:block">
              <p className="font-brand text-[15px] font-bold leading-tight tracking-tight text-white lg:text-base">
                Al Qibla Air Services
              </p>
              <p className="text-[11px] font-medium tracking-[0.14em] text-gold-light/90 uppercase">
                Travel Smart · Travel Safe
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {MAIN_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-[13px] font-medium tracking-wide transition-colors",
                  isActive(link.href)
                    ? "text-gold"
                    : "text-white/70 hover:text-white"
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <AccountNav />
            <button
              type="button"
              onClick={openSupportChat}
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "hidden h-10 border-white/20 bg-white/5 px-3.5 text-white hover:border-gold/50 hover:bg-gold/10 hover:text-gold md:inline-flex"
              )}
            >
              <MessageSquareText className="mr-2 h-4 w-4" />
              Ask Al Qibla
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-10 w-10 text-white hover:bg-white/10 lg:hidden"
                )}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-1.5rem,360px)] overflow-y-auto border-l border-white/10 bg-navy text-white">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3 text-left font-heading text-lg text-white">
                    <Image
                      src={assetPath(LOGO_NAV_PATH)}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                      unoptimized
                    />
                    {SITE.name}
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-1">
                  {[...MAIN_NAV, ...MOBILE_EXTRA].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-white/10",
                        isActive(link.href) ? "bg-white/5 text-gold" : "text-white/85"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={openSupportChat}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-left font-semibold text-gold"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Ask Al Qibla — AI support
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
