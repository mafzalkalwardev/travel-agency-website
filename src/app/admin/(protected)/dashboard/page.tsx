import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { dataProvider } from "@/lib/data-provider";

export default async function AdminDashboardPage() {
  const [inquiries, allTickets, umrah, blog, flyers, pendingBookings, failedHolds] = await Promise.all([
    getInquiryCount(),
    dataProvider.getTickets(),
    dataProvider.getUmrahPackages(),
    dataProvider.getBlogPosts(),
    dataProvider.getFlyers(),
    getPendingBookingsCount(),
    getFailedHoldsCount(),
  ]);

  const stats = [
    { label: "Pending Payment", value: pendingBookings, href: "/admin/bookings/" },
    { label: "Failed Supplier Holds", value: failedHolds, href: "/admin/bookings/" },
    { label: "New Inquiries", value: inquiries.new, href: "/admin/inquiries/" },
    { label: "Pending Reviews", value: inquiries.pendingReviews, href: "/admin/reviews/" },
    { label: "Active Tickets", value: allTickets.filter((t) => t.status !== "sold_out").length, href: "/admin/tickets/" },
    { label: "Umrah Packages", value: umrah.length, href: "/admin/umrah-packages/" },
    { label: "Blog Posts", value: blog.length, href: "/admin/blog/" },
    { label: "Active Flyers", value: flyers.length, href: "/admin/flyers/" },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isSupabaseConfigured()
          ? "Connected to Supabase"
          : "Development mode — using fallback seed data. Configure Supabase for live admin."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-navy">{s.value}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

async function getInquiryCount() {
  let newCount = 0;
  let pendingReviews = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { count: inquiryCount } = await supabase
        .from("inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");
      const { count: reviewCount } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      newCount = inquiryCount || 0;
      pendingReviews = reviewCount || 0;
    } catch {
      /* fallback */
    }
  }

  return { new: newCount, pendingReviews };
}

async function getPendingBookingsCount() {
  if (!isSupabaseConfigured()) return 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_payment");
    return count || 0;
  } catch {
    return 0;
  }
}

async function getFailedHoldsCount() {
  if (!isSupabaseConfigured()) return 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_payment")
      .eq("supplier_hold_status", "failed");
    return count || 0;
  } catch {
    return 0;
  }
}
