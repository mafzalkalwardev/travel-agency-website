"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Booking, BookingStatus } from "@/types";
import { toast } from "sonner";

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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setBookings((data as Booking[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: BookingStatus) {
    const res = await fetch(`/api/admin/bookings/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Failed to update booking");
      return;
    }
    const json = await res.json();
    toast.success(json.status === "confirmed" ? "Payment confirmed — booking complete" : "Booking updated");
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
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Seats are held at Travel Line on submit. Confirm payment after WhatsApp, then mark complete here.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "pending_payment", "payment_confirmed", "confirmed", "failed"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "navy" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : bookings.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No bookings yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-base font-semibold text-navy">
                    {b.customer_name} - {b.product_title || b.product_type}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleString()} · Ref {b.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[b.status]}>{b.status.replace(/_/g, " ")}</Badge>
                  {b.supplier_hold_status && (
                    <Badge className={holdBadge[b.supplier_hold_status] || "bg-gray-100"}>
                      hold: {b.supplier_hold_status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <p><strong>Phone:</strong> {b.customer_phone}</p>
                  <p><strong>Email:</strong> {b.customer_email || "—"}</p>
                  <p><strong>Passengers:</strong> {b.passengers}</p>
                  <p><strong>Price:</strong> {Number(b.quoted_price).toLocaleString()} {b.currency}</p>
                  {b.travelline_booking_ref && (
                    <p><strong>Supplier Ref:</strong> {b.travelline_booking_ref}</p>
                  )}
                  {b.supplier_hold_attempts != null && b.supplier_hold_attempts > 0 && (
                    <p><strong>Hold attempts:</strong> {b.supplier_hold_attempts}</p>
                  )}
                </div>
                {b.passenger_details && (
                  <p className="text-muted-foreground">
                    <strong>Details:</strong>{" "}
                    {JSON.stringify(b.passenger_details)}
                  </p>
                )}
                {(b.error_message || b.supplier_hold_error) && (
                  <p className="text-brand-red">{b.supplier_hold_error || b.error_message}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {b.status === "pending_payment" && (
                    <Button size="sm" variant="navy" onClick={() => updateStatus(b.id, "payment_confirmed")}>
                      Mark Payment Confirmed
                    </Button>
                  )}
                  {b.supplier_hold_status === "failed" && b.status !== "cancelled" && (
                    <Button
                      size="sm"
                      className="bg-gold text-navy hover:bg-gold-light"
                      onClick={() => retrySupplierHold(b.id)}
                    >
                      Retry Supplier Hold
                    </Button>
                  )}
                  {(b.status === "pending_payment" || b.status === "payment_confirmed") && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "cancelled")}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
