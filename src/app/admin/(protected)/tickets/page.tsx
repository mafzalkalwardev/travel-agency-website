"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";
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

export default function AdminTicketsPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [changes, setChanges] = useState<SyncChange[]>([]);
  const [ticketCount, setTicketCount] = useState(0);

  async function loadSyncState() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const [{ data: sync }, { count }, { data: recentChanges }] = await Promise.all([
      supabase
        .from("sync_logs")
        .select("provider, status, tickets_processed, tickets_created, tickets_updated, tickets_deactivated, message, completed_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
      supabase
        .from("sync_changes")
        .select("id, provider, entity_type, external_id, change_type, field_changes, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setLastSync(sync);
    setTicketCount(count ?? 0);
    setChanges((recentChanges as SyncChange[]) || []);
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
      toast.success(json.tickets?.message || "Sync complete");
      await loadSyncState();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Ticket Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Agent-only Travel Line sync. {ticketCount} active tickets in database.
          </p>
        </div>
        <Button onClick={runSync} disabled={syncing} variant="navy">
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
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
            <p className="text-muted-foreground">No sync runs yet. Set TRAVELLINE_* env vars and click Sync Now.</p>
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
                      <span className="font-medium text-navy">
                        {change.entity_type.replace("_", " ")}
                      </span>
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
