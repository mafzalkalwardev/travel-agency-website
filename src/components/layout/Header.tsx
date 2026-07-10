"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccountNav } from "@/components/account/AccountNav";
import { LOGO_PATH, SERVICE_DROPDOWN, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/base-path";

const MAIN_NAV = [
  { href: "/available-tickets/", label: "Tickets" },
  { href: "/umrah-packages/", label: "Umrah" },
  { href: "/flight-booking/", label: "Flights" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
] as const;

function isServiceActive(pathname: string | null) {
  const servicePaths = ["/services", "/tour-packages", "/corporate-travel", "/destinations", "/gallery", "/blog"];
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
        "sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-md transition-shadow",
        scrolled && "shadow-lg shadow-black/20"
      )}
    >
      <div className="container-wide flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src={assetPath(LOGO_PATH)}
            alt={SITE.name}
            width={48}
            height={48}
            className="h-10 w-10 rounded-lg object-contain"
            unoptimized
            priority
          />
          <span className="hidden font-semibold text-white sm:block">Al Qibla</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href="/"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive("/") ? "text-gold" : "text-white/80 hover:text-white"
            )}
          >
            Home
          </Link>

          {MAIN_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href) ? "text-gold" : "text-white/80 hover:text-white"
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
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isServiceActive(pathname) ? "text-gold" : "text-white/80 hover:text-white"
              )}
            >
              More
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", servicesOpen && "rotate-180")} />
            </button>
            {servicesOpen && (
              <div className="absolute left-0 top-full z-50 pt-1">
                <div className="min-w-[200px] rounded-lg border border-white/10 bg-navy py-1 shadow-xl">
                  {SERVICE_DROPDOWN.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-gold"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <AccountNav />
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "primaryGold", size: "default" }), "hidden h-9 px-3 sm:inline-flex")}
          >
            <Phone className="mr-1.5 h-4 w-4" />
            WhatsApp
          </a>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9 text-white hover:bg-white/10 lg:hidden"
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,300px)] overflow-y-auto bg-navy text-white">
              <SheetHeader>
                <SheetTitle className="text-left text-base font-semibold text-white">{SITE.shortName}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-0.5">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium",
                    isActive("/") ? "bg-white/10 text-gold" : "text-white/90 hover:bg-white/5"
                  )}
                >
                  Home
                </Link>
                {[...MAIN_NAV].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium",
                      isActive(link.href) ? "bg-white/10 text-gold" : "text-white/90 hover:bg-white/5"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <p className="mt-4 px-3 pb-1 text-xs font-medium uppercase tracking-wider text-white/50">More</p>
                {SERVICE_DROPDOWN.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-gold"
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
