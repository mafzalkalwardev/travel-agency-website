"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Star,
  Ticket,
  FileText,
  Image as ImageIcon,
  Settings,
  Megaphone,
  Plane,
  Package,
  MapPin,
  Compass,
  LogOut,
  Menu,
  ClipboardList,
  BarChart3,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { assetPath } from "@/lib/base-path";
import { LOGO_NAV_PATH, SITE } from "@/lib/constants";

const links = [
  { href: "/admin/dashboard/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/flight-analytics/", label: "Flight Analytics", icon: BarChart3 },
  { href: "/admin/bookings/", label: "Bookings", icon: ClipboardList },
  { href: "/admin/customers/", label: "Customers", icon: Users },
  { href: "/admin/inquiries/", label: "Inquiries", icon: MessageSquare },
  { href: "/admin/reviews/", label: "Reviews", icon: Star },
  { href: "/admin/tickets/", label: "Tickets", icon: Ticket },
  { href: "/admin/umrah-packages/", label: "Umrah Packages", icon: Package },
  { href: "/admin/tour-packages/", label: "Tour Packages", icon: MapPin },
  { href: "/admin/tours/", label: "Tours", icon: Compass },
  { href: "/admin/blog/", label: "Blog", icon: FileText },
  { href: "/admin/flyers/", label: "Flyers", icon: ImageIcon },
  { href: "/admin/announcements/", label: "Announcements", icon: Megaphone },
  { href: "/admin/gallery/", label: "Gallery", icon: ImageIcon },
  { href: "/admin/airlines/", label: "Airlines", icon: Plane },
  { href: "/admin/settings/", label: "Integrations", icon: Settings },
];

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin/dashboard/" className="flex items-center gap-3">
      <NextImage
        src={assetPath(LOGO_NAV_PATH)}
        alt={SITE.name}
        width={compact ? 36 : 44}
        height={compact ? 36 : 44}
        className={cn("object-contain", compact ? "h-9 w-9" : "h-11 w-11")}
        unoptimized
      />
      <div className="min-w-0">
        <p className="font-heading text-sm font-bold text-gold">Al Qibla Admin</p>
        <p className="truncate text-xs text-white/50">Travel Management</p>
      </div>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith(href.replace(/\/$/, ""))
              ? "bg-gold/15 text-gold"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function AgencyCredit() {
  return (
    <a
      href="https://www.induswebagency.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold/70 hover:bg-gold/20 hover:text-gold"
    >
      <span className="font-medium normal-case tracking-normal text-white/70 group-hover:text-white/90">
        Made by
      </span>
      <span className="font-bold tracking-[0.12em]">INDUS WEB AGENCY</span>
      <ArrowUpRight className="h-3 w-3 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

export function AdminSidebar() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login/");
    router.refresh();
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-navy lg:flex">
        <div className="border-b border-white/10 p-5">
          <BrandBlock />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <NavLinks />
        </div>
        <div className="border-t border-white/10 p-4">
          <Button variant="ghost" className="w-full justify-start text-white/70" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
          <AgencyCredit />
        </div>
      </aside>

      <div className="flex items-center border-b border-white/10 bg-navy px-4 py-3 lg:hidden">
        <Sheet>
          <SheetTrigger className="text-white">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col bg-navy text-white">
            <div className="mb-5">
              <BrandBlock compact />
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks />
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-white/70"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
              <AgencyCredit />
            </div>
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2">
          <NextImage
            src={assetPath(LOGO_NAV_PATH)}
            alt={SITE.name}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            unoptimized
          />
          <span className="font-heading text-sm font-bold text-white">Al Qibla Admin</span>
        </div>
      </div>
    </>
  );
}
