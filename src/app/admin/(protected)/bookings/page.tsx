"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatHoldCountdown, isHoldExpiringSoon } from "@/lib/booking/hold-expiry";
import { humanizeSupplierHoldError } from "@/lib/booking/hold-messages";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus, CustomerProfile } from "@/types";
import { toast } from "sonner";

type AgentCompanyInfo = Pick<CustomerProfile, "id" | "company_name" | "city" | "full_name">;
type BookingFilter = BookingStatus | "all" | "open";

const OPEN_STATUSES: BookingStatus[] = [
  "pending_payment",
  "booking_in_progress",
  "payment_confirmed",
];

const FILTERS: { id: BookingFilter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "all", label: "All" },
  { id: "pending_payment", label: "pending payment" },
  { id: "booking_in_progress", label: "booking in progress" },
  { id: "payment_confirmed", label: "payment confirmed" },
  { id: "confirmed", label: "confirmed" },
  { id: "failed", label: "failed" },
  { id: "cancelled", label: "cancelled" },
];

const statusColors: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_confirmed: "bg-blue-100 text-blue-800",
  booking_in_progress: "bg-purple-100 text-purple-800",
  confirmed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const holdBadge: Record<string, string> = {
  held: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  pending: "bg-purple-100 text-purple-800",
};

const tlStatusBadge: Record<string, string> = {
  RESERVED: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-900",
  CANCELLED: "bg-gray-200 text-gray-700",
};

function formatPassengerDetails(details: Record<string, unknown> | null | undefined) {
  if (!details) return null;
  const names = details.names ? String(details.names) : null;
  const notes = details.notes ? String(details.notes) : null;
  if (!names && !notes) return JSON.stringify(details);
  return [names, notes].filter(Boolean).join(" · ");
}

function whatsappCustomerLink(phone: string, name: string, ref: string) {
  const digits = phone.replace(/\D/g, "");
  const msg = encodeURIComponent(
    `Hello ${name}, this is ${SITE.name} regarding your booking ${ref}.`
  );
  return `https://wa.me/${digits}?text=${msg}`;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statsSource, setStatsSource] = useState<Booking[]>([]);
  const [agentById, setAgentById] = useState<Record<string, AgentCompanyInfo>>({});
  const [filter, setFilter] = useState<BookingFilter>("open");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (filter === "open") query = query.in("status", OPEN_STATUSES);
    else if (filter !== "all") query = query.eq("status", filter);

    const [{ data }, { data: openForStats }] = await Promise.all([
      query,
      supabase
        .from("bookings")
        .select(
          "id,status,supplier_hold_status,created_at,updated_at,hold_expires_at,travelline_response"
        )
        .eq("status", "pending_payment")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const rows = (data as Booking[]) || [];
    setBookings(rows);
    setStatsSource((openForStats as unknown as Booking[]) || []);

    const userIds = [
      ...new Set(rows.map((b) => b.customer_user_id).filter((id): id is string => Boolean(id))),
    ];
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("customer_profiles")
        .select("id, company_name, city, full_name")
        .in("id", userIds);
      const map: Record<string, AgentCompanyInfo> = {};
      for (const profile of (profiles as AgentCompanyInfo[]) || []) {
        map[profile.id] = profile;
      }
      setAgentById(map);
    } else {
      setAgentById({});
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      pending: statsSource.filter((b) => b.status === "pending_payment").length,
      held: statsSource.filter(
        (b) => b.status === "pending_payment" && b.supplier_hold_status === "held"
      ).length,
      failedHold: statsSource.filter(
        (b) => b.status === "pending_payment" && b.supplier_hold_status === "failed"
      ).length,
      expiringSoon: statsSource.filter(
        (b) =>
          b.status === "pending_payment" &&
          b.supplier_hold_status === "held" &&
          isHoldExpiringSoon(b)
      ).length,
    }),
    [statsSource]
  );

  async function updateStatus(id: string, status: BookingStatus, forceLocal = false) {
    const res = await fetch(`/api/admin/bookings/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, force_local: forceLocal || undefined }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(
        (json as { error?: string }).error ||
          "Supplier confirm failed — retry or settle manually"
      );
      load();
      return;
    }
    const tl = (json as { travellineStatus?: string }).travellineStatus;
    toast.success(
      (json as { status?: string }).status === "confirmed"
        ? `Ticket confirmed${tl ? ` (${tl})` : ""}`
        : "Booking updated"
    );
    load();
  }

  async function retrySupplierHold(id: string) {
    const res = await fetch(`/api/admin/bookings/${id}/confirm/`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Supplier hold retry failed");
    } else {
      toast.success(`Hold active: ${json.bookingRef || "OK"}`);
    }
    load();
  }

  async function syncTravelLine(id: string) {
    const res = await fetch(`/api/admin/bookings/${id}/sync-supplier/`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || "Could not sync supplier status");
    } else {
      toast.success(`Supplier: ${(json as { travellineStatus?: string }).travellineStatus || "synced"}`);
    }
    load();
  }

  async function resendEmails(id: string) {
    const res = await fetch(`/api/admin/bookings/${id}/notify/`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || "Failed to resend emails");
      return;
    }
    toast.success(
      (json as { template?: string }).template === "payment_confirmed"
        ? "Payment confirmation emails resent"
        : "Booking request emails resent"
    );
    load();
  }

  function copyRef(ref: string) {
    navigator.clipboard.writeText(ref).then(() => toast.success("Copied to clipboard"));
  }

  if (!isSupabaseConfigured()) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Configure Supabase to manage bookings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Open requests only by default. Failed holds are not confirmed tickets — stale attempts
            auto-cancel after a few days or once the flight date has passed.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
              <p className="text-2xl font-bold text-navy">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.expiringSoon > 0 ? "border-brand-red/40" : undefined}>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-brand-red" />
            <div>
              <p className="text-xs text-muted-foreground">Holds expiring soon</p>
              <p className="text-2xl font-bold text-navy">{stats.expiringSoon}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Supplier holds active</p>
              <p className="text-2xl font-bold text-navy">{stats.held}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Failed holds</p>
              <p className="text-2xl font-bold text-navy">{stats.failedHold}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={filter === s.id ? "navy" : "outline"}
            onClick={() => setFilter(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No bookings in this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const ref = b.id.slice(0, 8).toUpperCase();
            const agent = b.customer_user_id ? agentById[b.customer_user_id] : undefined;
            const companyLabel = agent?.company_name || null;
            const cityLabel = agent?.city || null;
            const passengerText = formatPassengerDetails(
              b.passenger_details as Record<string, unknown> | undefined
            );
            const holdCountdown =
              b.status === "pending_payment" && b.supplier_hold_status === "held"
                ? formatHoldCountdown(b)
                : null;
            const holdUrgent = holdCountdown ? isHoldExpiringSoon(b) : false;

            return (
              <Card key={b.id} className="overflow-hidden border-border/70">
                <CardHeader className="border-b border-border/40 bg-secondary/20 pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-navy">
                        {b.product_title || b.product_type}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {b.customer_name} · Ref <strong className="text-navy">{ref}</strong>
                      </p>
                      {(companyLabel || cityLabel) && (
                        <p className="mt-0.5 text-sm font-medium text-navy">
                          {companyLabel || "Agency"}
                          {cityLabel ? ` · ${cityLabel}` : ""}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleString()}
                      </p>
                      {holdCountdown && (
                        <p
                          className={cn(
                            "mt-1 text-xs font-semibold",
                            holdUrgent ? "text-brand-red" : "text-amber-700"
                          )}
                        >
                          {holdCountdown}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusColors[b.status]}>{b.status.replace(/_/g, " ")}</Badge>
                      {b.travelline_status && (
                        <Badge className={tlStatusBadge[b.travelline_status] || "bg-gray-100"}>
                          {b.travelline_status}
                        </Badge>
                      )}
                      {b.supplier_hold_status && (
                        <Badge className={holdBadge[b.supplier_hold_status] || "bg-gray-100"}>
                          hold: {b.supplier_hold_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <p>
                      <span className="text-muted-foreground">Company</span>
                      <br />
                      <span className="font-medium text-navy">
                        {companyLabel || "—"}
                        {cityLabel ? ` · ${cityLabel}` : ""}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Phone</span>
                      <br />
                      <a href={`tel:${b.customer_phone}`} className="font-medium text-navy hover:text-gold">
                        {b.customer_phone}
                      </a>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email</span>
                      <br />
                      {b.customer_email || "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Passengers</span>
                      <br />
                      <strong>{b.passengers}</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Quoted price</span>
                      <br />
                      <strong className="text-gold">
                        {Number(b.quoted_price).toLocaleString()} {b.currency}
                      </strong>
                    </p>
                  </div>

                  {(b.travelline_booking_ref || b.travelline_order_id) && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <span className="font-medium text-emerald-900">Supplier ref:</span>
                      <code className="text-emerald-800">
                        {b.travelline_order_id || b.travelline_booking_ref}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => copyRef((b.travelline_order_id || b.travelline_booking_ref)!)}
                      >
                        Copy
                      </Button>
                      {b.travelline_confirmed_at && (
                        <span className="text-xs text-emerald-800">
                          confirmed {new Date(b.travelline_confirmed_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {b.notifications_sent_at ? (
                      <span className="text-emerald-700">
                        Booking emails sent {new Date(b.notifications_sent_at).toLocaleString()}
                      </span>
                    ) : (
                      <span>Booking emails not sent yet (Resend optional)</span>
                    )}
                  </div>

                  {passengerText && (
                    <p className="rounded-lg bg-secondary/40 px-3 py-2 text-muted-foreground">
                      <strong className="text-navy">Passengers:</strong> {passengerText}
                    </p>
                  )}

                  {(b.error_message || b.supplier_hold_error) && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-brand-red">
                      {humanizeSupplierHoldError(b.supplier_hold_error || b.error_message) ||
                        b.supplier_hold_error ||
                        b.error_message}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 border-t border-border/40 pt-3">
                    <a
                      href={whatsappCustomerLink(b.customer_phone, b.customer_name, ref)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium hover:border-gold hover:text-gold"
                    >
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                      WhatsApp customer
                    </a>
                    <a
                      href={`tel:${b.customer_phone}`}
                      className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium hover:border-gold hover:text-gold"
                    >
                      <Phone className="mr-1.5 h-3.5 w-3.5" />
                      Call
                    </a>
                    {b.status === "pending_payment" && (
                      <Button size="sm" variant="navy" onClick={() => updateStatus(b.id, "payment_confirmed")}>
                        Confirm payment
                      </Button>
                    )}
                    {b.status === "booking_in_progress" && (
                      <>
                        <Button size="sm" variant="navy" onClick={() => updateStatus(b.id, "payment_confirmed")}>
                          Retry supplier confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(b.id, "payment_confirmed", true)}
                        >
                          Mark paid locally only
                        </Button>
                      </>
                    )}
                    {b.supplier_hold_status === "failed" && b.status !== "cancelled" && (
                      <Button
                        size="sm"
                        className="bg-gold text-navy hover:bg-gold-light"
                        onClick={() => retrySupplierHold(b.id)}
                      >
                        Retry supplier hold
                      </Button>
                    )}
                    {(b.travelline_booking_ref || b.travelline_order_id) && (
                      <Button size="sm" variant="outline" onClick={() => syncTravelLine(b.id)}>
                        Sync supplier status
                      </Button>
                    )}
                    {(b.status === "pending_payment" ||
                      b.status === "payment_confirmed" ||
                      b.status === "booking_in_progress") && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "cancelled")}>
                        Cancel
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => resendEmails(b.id)}>
                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                      Resend emails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
