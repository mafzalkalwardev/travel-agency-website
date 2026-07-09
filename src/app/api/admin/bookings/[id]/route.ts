import { NextResponse } from "next/server";
import {
  bookingRowToEmailData,
  sendPaymentConfirmedNotifications,
} from "@/lib/email/send-booking-notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const status = body.status as string;
  const adminNotes = body.admin_notes as string | undefined;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const allowed = ["payment_confirmed", "confirmed", "cancelled", "pending_payment"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase.from("bookings").select("*").eq("id", id).single();
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  let finalStatus = status;
  if (status === "payment_confirmed" && existing.supplier_hold_status === "held") {
    finalStatus = "confirmed";
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: finalStatus,
      admin_notes: adminNotes ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status === "payment_confirmed" || finalStatus === "confirmed") {
    const { data: updated } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (updated) {
      sendPaymentConfirmedNotifications(bookingRowToEmailData(updated)).catch(() => {
        /* non-blocking */
      });
    }
  }

  return NextResponse.json({ success: true, status: finalStatus });
}
