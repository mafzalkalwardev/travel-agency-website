import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { dataProvider } from "@/lib/data-provider";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/types";

export default async function AdminDashboardPage() {
  const [inquiries, allTickets, umrah, blog, flyers, pendingBookings, failedHolds, pendingCustomers, lastSync, recentBookings] =
    await Promise.all([
      getInquiryCount(),
      dataProvider.getTickets(),
      dataProvider.getUmrahPackages(),
      dataProvider.getBlogPosts(),
      dataProvider.getFlyers(),
      getPendingBookingsCount(),
      getFailedHoldsCount(),
      getPendingCustomersCount(),
      getLastSync(),
      getRecentBookings(),
    ]);

  const liveTickets = allTickets.filter((t) => t.status !== "sold_out" && t.seatsLeft > 0);

  const stats = [
    { label: "Pending Payment", value: pendingBookings, href: "/admin/bookings/", urgent: pendingBookings > 0 },
    { label: "Failed Supplier Holds", value: failedHolds, href: "/admin/bookings/", urgent: failedHolds > 0 },
    { label: "Customers to Approve", value: pendingCustomers, href: "/admin/customers/", urgent: pendingCustomers > 0 },
    { label: "Live Group Tickets", value: liveTickets.length, href: "/admin/tickets/" },
    { label: "New Inquiries", value: inquiries.new, href: "/admin/inquiries/" },
    { label: "Pending Reviews", value: inquiries.pendingReviews, href: "/admin/reviews/" },
    { label: "Umrah Packages", value: umrah.length, href: "/admin/umrah-packages/" },
    { label: "Blog Posts", value: blog.length, href: "/admin/blog/" },
    { label: "Active Flyers", value: flyers.length, href: "/admin/flyers/" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSupabaseConfigured()
            ? "Agent portal — live inventory, bookings, and customer approvals"
            : "Development mode — configure Supabase for live admin."}
        </p>
        {lastSync?.completed_at && (
          <p className="mt-2 text-xs text-muted-foreground">
            Last ticket sync: {new Date(lastSync.completed_at).toLocaleString()} · {lastSync.status}
            {lastSync.message ? ` — ${lastSync.message}` : ""}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
              s.urgent ? "border-gold/40 bg-gold/5" : "border-border"
            }`}
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-navy">{s.value}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-navy">Recent bookings</h2>
          <Link href="/admin/bookings/" className="text-sm font-medium text-gold hover:underline">
            View all
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="mt-4 divide-y">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-navy">{b.product_title || b.product_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.customer_name} · Ref {b.id.slice(0, 8).toUpperCase()} ·{" "}
                    {new Date(b.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{b.status.replace(/_/g, " ")}</Badge>
                  {b.supplier_hold_status && (
                    <Badge variant="outline">hold: {b.supplier_hold_status}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/settings/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-navy hover:border-gold"
        >
          Integrations & sync
        </Link>
        <Link
          href="/admin/flight-analytics/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-navy hover:border-gold"
        >
          Flight analytics
        </Link>
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

async function getPendingCustomersCount() {
  if (!isSupabaseConfigured()) return 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("customer_profiles")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "pending");
    return count || 0;
  } catch {
    return 0;
  }
}

async function getLastSync() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sync_logs")
      .select("completed_at, status, message")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

async function getRecentBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    return (data as Booking[]) || [];
  } catch {
    return [];
  }
}
