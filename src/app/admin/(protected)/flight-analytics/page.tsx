import Link from "next/link";
import { Activity, AlertTriangle, BarChart3, Plane, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { dataProvider } from "@/lib/data-provider";
import { isTravelLineConfigured, isTravelLineSyncEnabled } from "@/lib/travelline/env";
import { isEmailConfigured } from "@/lib/email/resend";
import { formatPrice } from "@/lib/ticket-filters";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";

function cheapestTicket(tickets: Ticket[]) {
  return tickets.reduce<Ticket | null>((best, t) => {
    if (t.status === "sold_out" || t.seatsLeft <= 0) return best;
    if (!best || t.price < best.price) return t;
    return best;
  }, null);
}

function routeKey(t: Ticket) {
  return `${t.from}→${t.to}`;
}

export default async function AdminFlightAnalyticsPage() {
  const tickets = await dataProvider.getTickets();
  const liveTickets = tickets.filter((t) => t.status !== "sold_out" && t.seatsLeft > 0);
  const cheapest = cheapestTicket(liveTickets);
  const totalSeats = liveTickets.reduce((sum, t) => sum + t.seatsLeft, 0);
  const pipelineValue = liveTickets.reduce((sum, t) => sum + t.price * t.seatsLeft, 0);
  const maxPrice = Math.max(...liveTickets.map((t) => t.price), 1);

  const routeCounts = new Map<string, { count: number; minPrice: number; sample: Ticket }>();
  for (const t of liveTickets) {
    const key = routeKey(t);
    const existing = routeCounts.get(key);
    if (!existing || t.price < existing.minPrice) {
      routeCounts.set(key, {
        count: (existing?.count || 0) + 1,
        minPrice: Math.min(existing?.minPrice ?? t.price, t.price),
        sample: t,
      });
    } else {
      routeCounts.set(key, { ...existing, count: existing.count + 1 });
    }
  }

  const topRoutes = [...routeCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  const [pendingBookings, failedHolds, lastSync] = await Promise.all([
    getPendingBookingsCount(),
    getFailedHoldsCount(),
    getLastSync(),
  ]);

  const integration = [
    {
      label: "Travel Line inventory",
      status: isTravelLineSyncEnabled() ? "live" : "not configured",
      detail: isTravelLineConfigured()
        ? "Scraper sync + group flight holds"
        : "Set TRAVELLINE_AGENT_* env vars",
    },
    {
      label: "Booking holds",
      status: isTravelLineConfigured() ? "live" : "offline",
      detail: "POST /api/booking on submit",
    },
    {
      label: "Booking emails",
      status: isEmailConfigured() ? "live" : "optional",
      detail: isEmailConfigured() ? "Resend configured" : "WhatsApp flow works without email",
    },
    {
      label: "Customer approval",
      status: "live",
      detail: "Agents approved in admin before booking",
    },
  ] as const;

  const stats = [
    { label: "Live group tickets", value: liveTickets.length, icon: Plane, detail: `${totalSeats} seats available` },
    {
      label: "Inventory value",
      value: formatPrice(pipelineValue, "PKR"),
      icon: BarChart3,
      detail: "Seats × quoted fare (estimate)",
    },
    { label: "Pending payment", value: pendingBookings, icon: AlertTriangle, detail: "Awaiting WhatsApp payment" },
    { label: "Failed holds", value: failedHolds, icon: Activity, detail: "Retry from bookings admin" },
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Flight Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live Travel Line group inventory, booking pipeline, and integration status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/tickets/" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>
            Ticket sync
          </Link>
          <Link href="/available-tickets/" className={cn(buttonVariants({ variant: "navy" }), "h-10 px-4")}>
            Public inventory
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, detail }) => (
          <div key={label} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-bold text-navy">Top routes</h2>
              <p className="text-sm text-muted-foreground">From synced outbound group tickets</p>
            </div>
            <Badge variant="outline">Live data</Badge>
          </div>
          <div className="mt-5 space-y-4">
            {topRoutes.length ? (
              topRoutes.map(([route, info]) => (
                <div key={route} className="rounded-lg border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-navy">
                        {info.sample.fromCity} → {info.sample.toCity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {info.count} flight{info.count === 1 ? "" : "s"} · from {formatPrice(info.minPrice, "PKR")}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">{route}</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{
                        width: `${Math.max(18, Math.round((info.minPrice / maxPrice) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No live tickets. Run sync from Ticket Inventory.</p>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-navy">Highlights</h2>
            <div className="mt-4 space-y-3 text-sm">
              <MetricLine
                label="Cheapest live fare"
                value={
                  cheapest
                    ? `${cheapest.airline} ${formatPrice(cheapest.price, cheapest.currency)}`
                    : "N/A"
                }
              />
              <MetricLine label="Routes in catalog" value={String(routeCounts.size)} />
              <MetricLine
                label="Last sync"
                value={
                  lastSync?.completed_at
                    ? new Date(lastSync.completed_at).toLocaleString()
                    : "Not recorded"
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-navy">Integration status</h2>
            <div className="mt-4 space-y-3">
              {integration.map((item) => (
                <div key={item.label} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-navy">{item.label}</p>
                    <Badge
                      className={
                        item.status === "live"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "optional"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
            <Link
              href="/admin/settings/"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Integrations
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-right text-navy">{value}</strong>
    </div>
  );
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
