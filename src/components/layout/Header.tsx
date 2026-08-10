"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccountNav } from "@/components/account/AccountNav";
import { LOGO_NAV_PATH, LOGO_PATH, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/base-path";

const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/umrah-packages/", label: "Umrah" },
  { href: "/destinations/", label: "Group Travels" },
  { href: "/tours/", label: "Tours" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
] as const;

const MOBILE_EXTRA = [
  { href: "/account/", label: "Agent portal" },
  { href: "/inquiry/", label: "Book / Inquiry" },
  { href: "/portal/", label: "Portal" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b bg-white transition-shadow duration-300",
        scrolled
          ? "border-slate-200 shadow-[0_6px_24px_rgba(15,32,66,.08)]"
          : "border-slate-100"
      )}
    >
      <div className="container-wide">
        <div className="flex h-[74px] items-center justify-between gap-4 lg:h-[86px]">
          <Link href="/" className="group flex shrink-0 items-center" aria-label={SITE.name}>
            <Image
              src={assetPath(LOGO_PATH)}
              alt={SITE.name}
              width={248}
              height={193}
              className="h-12 w-auto object-contain transition group-hover:scale-[1.02] sm:h-14 lg:h-[64px]"
              unoptimized
              priority
            />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {MAIN_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-[15px] font-semibold tracking-wide transition-colors lg:text-base",
                  isActive(link.href) ? "text-royal" : "text-navy/70 hover:text-navy"
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <AccountNav />

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-10 w-10 text-navy hover:bg-navy/5 lg:hidden"
                )}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(100vw-1.5rem,360px)] overflow-y-auto border-l border-white/10 bg-navy text-white"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3 text-left font-heading text-lg text-white">
                    <Image
                      src={assetPath(LOGO_NAV_PATH)}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg bg-white object-contain p-0.5"
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
                        "rounded-xl px-4 py-3 text-lg font-semibold transition-colors hover:bg-white/10",
                        isActive(link.href) ? "bg-white/5 text-gold" : "text-white/85"
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
      </div>
    </header>
  );
}
