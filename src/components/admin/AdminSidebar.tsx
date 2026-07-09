"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Star,
  Ticket,
  FileText,
  Image,
  Settings,
  Megaphone,
  Plane,
  Package,
  MapPin,
  LogOut,
  Menu,
  ClipboardList,
  BarChart3,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
  { href: "/admin/blog/", label: "Blog", icon: FileText },
  { href: "/admin/flyers/", label: "Flyers", icon: Image },
  { href: "/admin/announcements/", label: "Announcements", icon: Megaphone },
  { href: "/admin/gallery/", label: "Gallery", icon: Image },
  { href: "/admin/airlines/", label: "Airlines", icon: Plane },
  { href: "/admin/settings/", label: "Settings", icon: Settings },
];

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
          <p className="font-heading text-sm font-bold text-gold">Al Qibla Admin</p>
          <p className="text-xs text-white/50">Travel Management</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <NavLinks />
        </div>
        <div className="border-t border-white/10 p-4">
          <Button variant="ghost" className="w-full justify-start text-white/70" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex items-center border-b border-white/10 bg-navy px-4 py-3 lg:hidden">
        <Sheet>
          <SheetTrigger className="text-white">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-navy text-white">
            <p className="mb-4 font-heading font-bold text-gold">Admin Menu</p>
            <NavLinks />
          </SheetContent>
        </Sheet>
        <span className="ml-3 font-heading text-sm font-bold text-white">Al Qibla Admin</span>
      </div>
    </>
  );
}
