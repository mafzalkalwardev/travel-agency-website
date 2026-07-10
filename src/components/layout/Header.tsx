"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Phone, Ticket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccountNav } from "@/components/account/AccountNav";
import { LOGO_PATH, SERVICE_DROPDOWN, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/base-path";

/** Top-level nav — Umrah, Tours, Corporate live under Services dropdown */
const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About Us" },
  { href: "/flight-booking/", label: "Book Flights" },
  { href: "/available-tickets/", label: "Available Tickets" },
  { href: "/destinations/", label: "Destinations" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/blog/", label: "Blog" },
  { href: "/contact/", label: "Contact" },
] as const;

const MOBILE_EXTRA = [
  { href: "/account/", label: "My Trips" },
  { href: "/inquiry/", label: "Book / Inquiry" },
] as const;

function isServiceActive(pathname: string | null) {
  const servicePaths = ["/services", "/umrah-packages", "/tour-packages", "/corporate-travel"];
  return servicePaths.some((p) => pathname?.startsWith(p));
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

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
        "sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-xl transition-all duration-300",
        scrolled && "shadow-xl shadow-black/25"
      )}
    >
      <div className="container-wide flex h-20 items-center justify-between gap-4 lg:h-[88px]">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src={assetPath(LOGO_PATH)}
            alt={SITE.name}
            width={64}
            height={64}
            className="h-14 w-14 rounded-xl object-contain ring-1 ring-white/10 lg:h-16 lg:w-16"
            unoptimized
            priority
          />
          <div className="hidden min-w-0 sm:block">
            <p className="font-heading text-base font-bold leading-tight text-white lg:text-lg">
              Al Qibla Air Services
            </p>
            <p className="text-xs text-gold-light lg:text-sm">Travel Smart. Travel Safe.</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 min-[1800px]:flex xl:gap-1">
          {MAIN_NAV.slice(0, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(link.href) ? "bg-white/10 text-gold" : "text-white/85 hover:bg-white/5 hover:text-gold"
              )}
            >
              {link.label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isServiceActive(pathname) ? "bg-white/10 text-gold" : "text-white/85 hover:bg-white/5 hover:text-gold"
              )}
            >
              Services
              <ChevronDown className={cn("h-4 w-4 transition-transform", servicesOpen && "rotate-180")} />
            </button>
            {servicesOpen && (
              <div className="absolute left-0 top-full z-50 pt-2">
                <div className="min-w-[240px] rounded-xl border border-white/10 bg-navy py-2 shadow-2xl">
                  {SERVICE_DROPDOWN.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-gold"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {MAIN_NAV.slice(2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(link.href) ? "bg-white/10 text-gold" : "text-white/85 hover:bg-white/5 hover:text-gold"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/available-tickets/"
            className={cn(buttonVariants({ variant: "outlineLight", size: "default" }), "hidden md:inline-flex h-10 px-4")}
          >
            <Ticket className="mr-2 h-4 w-4" />
            Check Tickets
          </Link>
          <AccountNav />
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "primaryGold", size: "default" }), "h-10 px-4")}
          >
            <Phone className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Book on </span>WhatsApp
          </a>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-10 w-10 text-white hover:bg-white/10 min-[1800px]:hidden"
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
                <p className="mt-6 px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-gold">Services</p>
                {SERVICE_DROPDOWN.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-white/85 hover:bg-white/10 hover:text-gold"
                  >
                    {item.label}
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
