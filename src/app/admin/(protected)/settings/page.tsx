"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Mail, Plane, Database, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminStatus {
  supabase: boolean;
  travelline: boolean;
  travellineSync: boolean;
  email: boolean;
  emailFrom: string | null;
  authFrom?: string | null;
  emailAdmin: string;
  emailSandbox?: boolean;
  lastSync: { completed_at: string | null; status: string | null; message: string | null } | null;
  recentSyncLogs: Array<{
    completed_at: string | null;
    status: string | null;
    message: string | null;
    tickets_processed: number | null;
  }>;
  outboundTickets: number;
  pendingCustomers: number;
  siteUrl: string | null;
}

function StatusRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 p-4">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      )}
      <div>
        <p className="font-medium text-navy">{label}</p>
        {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
      </div>
      <Badge className="ml-auto" variant={ok ? "default" : "outline"}>
        {ok ? "Active" : "Not configured"}
      </Badge>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  function loadStatus() {
    setLoading(true);
    fetch("/api/admin/status/")
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function runSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync/", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      toast.success(json.tickets?.message || "Inventory sync complete");
      loadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function sendTestEmail() {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch("/api/admin/email/test/", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      setEmailTestResult(`Test email sent to ${json.sentTo}`);
    } catch (e) {
      setEmailTestResult(e instanceof Error ? e.message : "Send failed");
    } finally {
      setTestingEmail(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Agent portal services — sync, booking holds, and notifications
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading status…</p>
      ) : status ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <StatusRow
              ok={status.supabase}
              label="Supabase database"
              detail="Tickets, bookings, customers, and sync logs"
            />
            <StatusRow
              ok={status.travelline}
              label="Travel Line booking"
              detail={
                status.travellineSync
                  ? "Agent credentials configured · scraper sync enabled"
                  : "Set TRAVELLINE_AGENT_USERNAME and TRAVELLINE_AGENT_PASSWORD"
              }
            />
            <StatusRow
              ok={status.email}
              label="Company email (Resend)"
              detail={
                status.email
                  ? status.emailSandbox
                    ? `Sandbox: auth ${status.authFrom || status.emailFrom} · booking ${status.emailFrom} → ${status.emailAdmin}`
                    : `Auth from ${status.authFrom || status.emailFrom} · Booking from ${status.emailFrom}`
                  : "Set RESEND_API_KEY and AUTH_FROM_EMAIL=noreply@alqiblaairservices.com (verified domain in Resend)"
              }
            />
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Plane className="h-8 w-8 text-gold" />
                <div>
                  <p className="text-xs text-muted-foreground">Outbound tickets live</p>
                  <p className="text-2xl font-bold text-navy">{status.outboundTickets}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base text-navy">
                <Database className="h-4 w-4" />
                Last inventory sync
              </CardTitle>
              <Button size="sm" variant="outline" disabled={syncing || !status.travellineSync} onClick={runSync}>
                <RefreshCw className={cn("mr-2 h-4 w-4", syncing && "animate-spin")} />
                {syncing ? "Syncing…" : "Sync now"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {status.lastSync?.completed_at ? (
                <>
                  <p>{status.lastSync.message}</p>
                  <p className="text-muted-foreground">
                    {new Date(status.lastSync.completed_at).toLocaleString()} ·{" "}
                    {status.lastSync.status}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No sync recorded yet.</p>
              )}
              {status.recentSyncLogs.length > 1 && (
                <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recent runs
                  </p>
                  {status.recentSyncLogs.slice(1).map((log, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {log.completed_at ? new Date(log.completed_at).toLocaleString() : "—"} ·{" "}
                      {log.status} · {log.tickets_processed ?? 0} items
                    </p>
                  ))}
                </div>
              )}
              <Link href="/admin/tickets/">
                <Button size="sm" variant="outline" className="mt-2">
                  Open ticket sync
                </Button>
              </Link>
            </CardContent>
          </Card>

          {status.pendingCustomers > 0 && (
            <Card className="border-gold/30 bg-gold/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-navy">
                    {status.pendingCustomers} customer{status.pendingCustomers === 1 ? "" : "s"} awaiting approval
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Agents must be approved before they can place holds
                  </p>
                </div>
                <Link href="/admin/customers/">
                  <Button size="sm" className="bg-navy text-white hover:bg-navy-light">
                    Review customers
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-navy">
                <Mail className="h-4 w-4" />
                Email setup (optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Add these to Vercel production environment:</p>
              <ul className="list-inside list-disc space-y-1 font-mono text-xs text-navy">
                <li>RESEND_API_KEY</li>
                <li>BOOKING_FROM_EMAIL (onboarding@resend.dev for test; custom domain when live)</li>
                <li>BOOKING_ADMIN_EMAIL (must match your Resend account email in sandbox)</li>
                <li>RESEND_SANDBOX_MODE=true until domain verified</li>
              </ul>
              <p className="pt-2 text-xs">
                Live domain checklist: <code>docs/RESEND-LIVE-DOMAIN.md</code>
              </p>
              <p className="pt-2">
                Without Resend, bookings still work — customers receive WhatsApp redirect and admin sees bookings here.
              </p>
              {status.email && (
                <div className="pt-3">
                  <Button size="sm" variant="outline" disabled={testingEmail} onClick={sendTestEmail}>
                    {testingEmail ? "Sending…" : "Send test email"}
                  </Button>
                  {emailTestResult && (
                    <p className="mt-2 text-xs text-muted-foreground">{emailTestResult}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {status.siteUrl && (
            <p className="text-xs text-muted-foreground">
              Production:{" "}
              <a href={status.siteUrl} className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">
                {status.siteUrl}
              </a>
            </p>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">Could not load integration status.</p>
      )}
    </div>
  );
}
