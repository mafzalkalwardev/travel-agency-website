"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatTicketDate } from "@/lib/ticket-filters";
import { toast } from "sonner";

interface SyncLog {
  provider: string;
  status: string;
  tickets_processed: number;
  tickets_created: number | null;
  tickets_updated: number | null;
  tickets_deactivated: number | null;
  message: string | null;
  completed_at: string | null;
}

interface SyncChange {
  id: string;
  provider: string;
  entity_type: string;
  external_id: string | null;
  change_type: "created" | "updated" | "deactivated";
  field_changes: Record<string, { old: unknown; new: unknown }>;
  created_at: string;
}

interface LiveTicket {
  id: string;
  airline: string;
  flight_number: string;
  sector: string;
  from_city: string;
  to_city: string;
  departure_date: string;
  departure_time: string | null;
  seats_left: number;
  price: number;
  currency: string;
  status: string;
  group_category: string | null;
}

export default function AdminTicketsPage() {
  const [syncing, setSyncing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [changes, setChanges] = useState<SyncChange[]>([]);
  const [ticketCount, setTicketCount] = useState(0);
  const [outboundCount, setOutboundCount] = useState(0);
  const [umrahCount, setUmrahCount] = useState(0);
  const [liveTickets, setLiveTickets] = useState<LiveTicket[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Array<{ name: string; count: number }>>([]);

  async function loadSyncState() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());

    const [
      { data: sync },
      { count },
      { count: outbound },
      { count: umrah },
      { data: recentChanges },
      { data: upcoming },
      { data: categoryRows },
    ] = await Promise.all([
      supabase
        .from("sync_logs")
        .select("provider, status, tickets_processed, tickets_created, tickets_updated, tickets_deactivated, message, completed_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("active", true).gte("departure_date", today),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("active", true)
        .gte("departure_date", today)
        .in("from_code", ["ISB", "LHE", "KHI", "PEW", "SKT", "MUX"]),
      supabase.from("umrah_packages").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("sync_changes")
        .select("id, provider, entity_type, external_id, change_type, field_changes, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("tickets")
        .select(
          "id, airline, flight_number, sector, from_city, to_city, departure_date, departure_time, seats_left, price, currency, status, group_category"
        )
        .eq("active", true)
        .gte("departure_date", today)
        .order("departure_date", { ascending: true })
        .order("departure_time", { ascending: true })
        .limit(25),
      supabase
        .from("tickets")
        .select("group_category")
        .eq("active", true)
        .gte("departure_date", today),
    ]);

    setLastSync(sync);
    setTicketCount(count ?? 0);
    setOutboundCount(outbound ?? 0);
    setUmrahCount(umrah ?? 0);
    setChanges((recentChanges as SyncChange[]) || []);
    setLiveTickets((upcoming as LiveTicket[]) || []);

    const tallies = new Map<string, number>();
    for (const row of categoryRows || []) {
      const name = row.group_category || "Uncategorized";
      tallies.set(name, (tallies.get(name) || 0) + 1);
    }
    setCategoryCounts(
      [...tallies.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    );
  }

  useEffect(() => {
    loadSyncState();
  }, []);

  async function runSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync/", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      const ticketMsg = json.tickets?.message || "Tickets synced";
      const packageMsg = json.packages?.message ? ` · ${json.packages.message}` : "";
      if (json.status === "partial" || json.packages?.status === "failed") {
        toast.warning(`${ticketMsg}${packageMsg}`);
      } else {
        toast.success(`${ticketMsg}${packageMsg}`);
      }
      await loadSyncState();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function runCleanup() {
    setCleaning(true);
    try {
      const res = await fetch("/api/admin/tickets/cleanup/", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Cleanup failed");
      toast.success(json.message || "Cleanup complete");
      await loadSyncState();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Ticket Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Live inventory sync · {outboundCount} outbound · {ticketCount} active tickets · {umrahCount} umrah packages
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={runCleanup} disabled={cleaning} variant="outline">
            {cleaning ? "Cleaning…" : "Clean return legs"}
          </Button>
          <Button onClick={runSync} disabled={syncing} variant="navy">
            {syncing ? "Syncing inventory…" : "Sync Now"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy">{ticketCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outbound PK sectors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy">{outboundCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Umrah packages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy">{umrahCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories synced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy">{categoryCounts.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-navy">Last sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!isSupabaseConfigured() ? (
            <p className="text-muted-foreground">Configure Supabase to enable ticket sync.</p>
          ) : lastSync ? (
            <>
              <div className="flex items-center gap-2">
                <Badge>{lastSync.provider}</Badge>
                <Badge variant="outline">{lastSync.status}</Badge>
              </div>
              <p>{lastSync.message}</p>
              <p className="text-muted-foreground">
                {lastSync.completed_at ? new Date(lastSync.completed_at).toLocaleString() : "No timestamp"} ·{" "}
                {lastSync.tickets_processed} items processed
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline">{lastSync.tickets_created || 0} new</Badge>
                <Badge variant="outline">{lastSync.tickets_updated || 0} changed</Badge>
                <Badge variant="outline">{lastSync.tickets_deactivated || 0} sold out</Badge>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No sync runs yet. Configure supplier credentials and click Sync Now.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-navy">Live inventory (next departures)</CardTitle>
          <Link href="/available-tickets/" className="text-sm font-medium text-gold hover:underline">
            Open public list
          </Link>
        </CardHeader>
        <CardContent>
          {liveTickets.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Flight</th>
                    <th className="py-2 pr-3 font-medium">Route</th>
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Seats</th>
                    <th className="py-2 pr-3 font-medium">Price</th>
                    <th className="py-2 font-medium">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liveTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-navy">{ticket.airline}</p>
                        <p className="text-xs text-muted-foreground">{ticket.flight_number}</p>
                      </td>
                      <td className="py-2.5 pr-3">
                        {ticket.from_city} → {ticket.to_city}
                        <p className="text-xs text-muted-foreground">{ticket.sector}</p>
                      </td>
                      <td className="py-2.5 pr-3">
                        {formatTicketDate(ticket.departure_date)}
                        {ticket.departure_time ? (
                          <p className="text-xs text-muted-foreground">{ticket.departure_time}</p>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3">{ticket.seats_left}</td>
                      <td className="py-2.5 pr-3 font-medium text-navy">
                        {formatPrice(Number(ticket.price), ticket.currency || "PKR")}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{ticket.group_category || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming active tickets. Run Sync Now.</p>
          )}

          {categoryCounts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryCounts.map((c) => (
                <Badge key={c.name} variant="outline">
                  {c.name}: {c.count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-navy">Recent inventory changes</CardTitle>
        </CardHeader>
        <CardContent>
          {changes.length ? (
            <div className="divide-y text-sm">
              {changes.map((change) => {
                const fields = Object.keys(change.field_changes || {});
                return (
                  <div key={change.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={change.change_type === "created" ? "default" : "outline"}>
                        {change.change_type.replace("_", " ")}
                      </Badge>
                      <span className="font-medium text-navy">{change.entity_type.replace("_", " ")}</span>
                      {change.external_id && (
                        <span className="text-xs text-muted-foreground">{change.external_id}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(change.created_at).toLocaleString()}
                      {fields.length ? ` · ${fields.join(", ")}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No field-level changes recorded yet. Run sync after the migration is applied.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
