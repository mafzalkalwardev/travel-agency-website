import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { dataProvider } from "@/lib/data-provider";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts, type DashboardChartData } from "@/components/admin/DashboardCharts";
import { resolveAirlineName } from "@/data/airlines";
import type { Booking, BookingStatus, Ticket } from "@/types";

const BOOKING_STATUSES: BookingStatus[] = [
  "pending_payment",
  "payment_confirmed",
  "booking_in_progress",
  "confirmed",
  "failed",
  "cancelled",
];

export default async function AdminDashboardPage() {
  const [
    inquiries,
    allTickets,
    umrah,
    tours,
    blog,
    flyers,
    galleryCount,
    pendingBookings,
    failedHolds,
    expiringHolds,
    pendingCustomers,
    lastSync,
    recentBookings,
    chartData,
  ] = await Promise.all([
    getInquiryCount(),
    dataProvider.getTickets(),
    dataProvider.getUmrahPackages(),
    dataProvider.getTourPackages().catch(() => []),
    dataProvider.getBlogPosts(),
    dataProvider.getFlyers(),
    getGalleryCount(),
    getPendingBookingsCount(),
    getFailedHoldsCount(),
    getExpiringHoldsCount(),
    getPendingCustomersCount(),
    getLastSync(),
    getRecentBookings(),
    getChartData(),
  ]);

  const liveTickets = allTickets.filter((t) => t.status !== "sold_out" && t.seatsLeft > 0);

  const stats = [
    { label: "Pending Payment", value: pendingBookings, href: "/admin/bookings/", urgent: pendingBookings > 0 },
    { label: "Holds Expiring Soon", value: expiringHolds, href: "/admin/bookings/", urgent: expiringHolds > 0 },
    { label: "Failed Supplier Holds", value: failedHolds, href: "/admin/bookings/", urgent: failedHolds > 0 },
    { label: "Customers to Approve", value: pendingCustomers, href: "/admin/customers/", urgent: pendingCustomers > 0 },
    { label: "Live Group Tickets", value: liveTickets.length, href: "/admin/tickets/" },
    { label: "New Inquiries", value: inquiries.new, href: "/admin/inquiries/" },
    { label: "Pending Reviews", value: inquiries.pendingReviews, href: "/admin/reviews/" },
    { label: "Umrah Packages", value: umrah.length, href: "/admin/umrah-packages/" },
    { label: "Tour Packages", value: tours.length, href: "/admin/tour-packages/" },
    { label: "Blog Posts", value: blog.length, href: "/admin/blog/" },
    { label: "Active Flyers", value: flyers.length, href: "/admin/flyers/" },
    { label: "Gallery Items", value: galleryCount, href: "/admin/gallery/" },
  ];

  // Enrich content inventory with live counts from this render
  const charts: DashboardChartData = {
    ...chartData,
    contentInventory: [
      { name: "Tickets", count: liveTickets.length },
      { name: "Umrah", count: umrah.length },
      { name: "Tours", count: tours.length },
      { name: "Blog", count: blog.length },
      { name: "Flyers", count: flyers.length },
      { name: "Gallery", count: galleryCount },
    ],
  };

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      <DashboardCharts data={charts} />

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

async function getGalleryCount() {
  if (!isSupabaseConfigured()) return 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("gallery_items")
      .select("*", { count: "exact", head: true })
      .eq("active", true);
    return count || 0;
  } catch {
    return 0;
  }
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

async function getExpiringHoldsCount() {
  if (!isSupabaseConfigured()) return 0;
  try {
    const { isHoldExpiringSoon } = await import("@/lib/booking/hold-expiry");
    const supabase = await createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "pending_payment")
      .eq("supplier_hold_status", "held")
      .limit(50);
    return (data || []).filter((b) => isHoldExpiringSoon(b)).length;
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
      .limit(8);
    return (data as Booking[]) || [];
  } catch {
    return [];
  }
}

function emptyChartData(): DashboardChartData {
  return {
    bookingsByStatus: BOOKING_STATUSES.map((status) => ({
      name: status.replace(/_/g, " "),
      value: 0,
    })),
    bookingsTrend: [],
    ticketsByAirline: [],
    topRoutes: [],
    contentInventory: [],
    agentsByStatus: [
      { name: "pending", value: 0 },
      { name: "approved", value: 0 },
      { name: "rejected", value: 0 },
    ],
    holdHealth: [
      { name: "held", value: 0 },
      { name: "failed", value: 0 },
      { name: "pending", value: 0 },
      { name: "none", value: 0 },
    ],
  };
}

function buildTicketCharts(tickets: Ticket[]) {
  const live = tickets.filter((t) => t.status !== "sold_out" && t.seatsLeft > 0);

  const byAirline = new Map<string, { tickets: number; seats: number }>();
  const byRoute = new Map<string, { tickets: number; seats: number }>();

  for (const ticket of live) {
    const airline = resolveAirlineName(ticket.airlineCode, ticket.airline);
    const airlineRow = byAirline.get(airline) || { tickets: 0, seats: 0 };
    airlineRow.tickets += 1;
    airlineRow.seats += ticket.seatsLeft;
    byAirline.set(airline, airlineRow);

    const route = `${ticket.from}-${ticket.to}`;
    const routeRow = byRoute.get(route) || { tickets: 0, seats: 0 };
    routeRow.tickets += 1;
    routeRow.seats += ticket.seatsLeft;
    byRoute.set(route, routeRow);
  }

  const ticketsByAirline = [...byAirline.entries()]
    .map(([name, row]) => ({ name, ...row }))
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 8);

  const topRoutes = [...byRoute.entries()]
    .map(([name, row]) => ({ name, ...row }))
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 8);

  return { ticketsByAirline, topRoutes };
}

function buildTrend(bookings: Booking[]) {
  const days = 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = new Map<string, { bookings: number; value: number }>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { bookings: 0, value: 0 });
  }

  for (const booking of bookings) {
    const key = new Date(booking.created_at).toISOString().slice(0, 10);
    const row = buckets.get(key);
    if (!row) continue;
    row.bookings += 1;
    row.value += Number(booking.quoted_price || 0);
  }

  return [...buckets.entries()].map(([iso, row]) => ({
    day: new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    bookings: row.bookings,
    value: Math.round(row.value),
  }));
}

async function getChartData(): Promise<DashboardChartData> {
  const base = emptyChartData();
  const tickets = await dataProvider.getTickets().catch(() => [] as Ticket[]);
  const ticketCharts = buildTicketCharts(tickets);
  base.ticketsByAirline = ticketCharts.ticketsByAirline;
  base.topRoutes = ticketCharts.topRoutes;

  if (!isSupabaseConfigured()) return base;

  try {
    const supabase = await createClient();
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const [{ data: bookings }, { data: agents }, { data: pendingHolds }] = await Promise.all([
      supabase
        .from("bookings")
        .select("status, quoted_price, created_at, supplier_hold_status")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("customer_profiles").select("approval_status").limit(2000),
      supabase
        .from("bookings")
        .select("supplier_hold_status")
        .eq("status", "pending_payment")
        .limit(500),
    ]);

    const bookingRows = (bookings as Booking[]) || [];
    const statusCounts = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0])) as Record<
      BookingStatus,
      number
    >;
    for (const booking of bookingRows) {
      if (statusCounts[booking.status] !== undefined) statusCounts[booking.status] += 1;
    }
    base.bookingsByStatus = BOOKING_STATUSES.map((status) => ({
      name: status.replace(/_/g, " "),
      value: statusCounts[status],
    })).filter((row) => row.value > 0);

    base.bookingsTrend = buildTrend(
      bookingRows.filter((b) => new Date(b.created_at) >= since)
    );

    const agentCounts = { pending: 0, approved: 0, rejected: 0 };
    for (const agent of agents || []) {
      const status = String(agent.approval_status || "pending") as keyof typeof agentCounts;
      if (status in agentCounts) agentCounts[status] += 1;
    }
    base.agentsByStatus = Object.entries(agentCounts).map(([name, value]) => ({ name, value }));

    const holdCounts = { held: 0, failed: 0, pending: 0, none: 0 };
    for (const row of pendingHolds || []) {
      const status = String(row.supplier_hold_status || "none");
      if (status === "held") holdCounts.held += 1;
      else if (status === "failed") holdCounts.failed += 1;
      else if (status === "pending") holdCounts.pending += 1;
      else holdCounts.none += 1;
    }
    base.holdHealth = Object.entries(holdCounts)
      .map(([name, value]) => ({ name, value }))
      .filter((row) => row.value > 0);

    return base;
  } catch {
    return base;
  }
}
