import { NextResponse } from "next/server";
import { attemptSupplierHold } from "@/lib/booking/supplier-hold";
import {
  bookingRowToEmailData,
  sendBookingReceivedNotifications,
} from "@/lib/email/send-booking-notifications";
import { getApprovalMessage } from "@/lib/customer-approval";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isTravelLineConfigured } from "@/lib/travelline/env";
import { bookingSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        bookingRef: `DEV-${Date.now()}`,
        message: "Booking request received (development mode).",
        devFallback: true,
        supplierHeld: false,
      });
    }

    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Create an account or sign in before booking.",
          loginUrl: "/account/login/",
        },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const { data: existingProfile } = await supabase
      .from("customer_profiles")
      .select("id, approval_status")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("customer_profiles").upsert(
        {
          id: user.id,
          email: user.email || data.customer_email || "",
          full_name: data.customer_name,
          phone: data.customer_phone,
          approval_status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }

    const approvalStatus = existingProfile?.approval_status ?? "pending";
    if (approvalStatus !== "approved") {
      return NextResponse.json(
        {
          error: getApprovalMessage(approvalStatus),
          approvalStatus,
        },
        { status: 403 }
      );
    }

    const profilePayload = {
      id: user.id,
      email: user.email || data.customer_email || "",
      full_name: data.customer_name,
      phone: data.customer_phone,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("customer_profiles").upsert(profilePayload, { onConflict: "id" });

    let externalProductId = data.external_product_id;
    if (!externalProductId && data.ticket_id) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("external_id")
        .eq("id", data.ticket_id)
        .maybeSingle();
      externalProductId = ticket?.external_id ?? undefined;
    }
    if (!externalProductId && data.umrah_package_id) {
      const { data: pkg } = await supabase
        .from("umrah_packages")
        .select("external_id")
        .eq("id", data.umrah_package_id)
        .maybeSingle();
      externalProductId = pkg?.external_id ?? undefined;
    }
    if (!externalProductId && data.tour_package_id) {
      const { data: pkg } = await supabase
        .from("tour_packages")
        .select("external_id")
        .eq("id", data.tour_package_id)
        .maybeSingle();
      externalProductId = pkg?.external_id ?? undefined;
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        status: "pending_payment",
        product_type: data.product_type,
        ticket_id: data.ticket_id || null,
        umrah_package_id: data.umrah_package_id || null,
        tour_package_id: data.tour_package_id || null,
        external_product_id: externalProductId || null,
        customer_user_id: user.id,
        product_title: data.product_title || null,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || null,
        passenger_details: data.passenger_details,
        passengers: data.passengers,
        quoted_price: data.quoted_price,
        currency: data.currency,
        source_page: data.source_page || null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let supplierHeld = false;
    let supplierRef: string | undefined;
    let supplierError: string | null = null;

    if (externalProductId && isTravelLineConfigured()) {
      const hold = await attemptSupplierHold(booking.id, {
        externalProductId,
        productType: data.product_type,
        passengers: data.passengers,
        passengerDetails: data.passenger_details,
        quotedPrice: data.quoted_price,
        currency: data.currency,
      });
      supplierHeld = hold.held;
      supplierRef = hold.bookingRef;
      supplierError = hold.error || null;
    }

    const { data: updatedBooking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking.id)
      .single();

    const emailData = bookingRowToEmailData(updatedBooking || booking);
    if (supplierRef) emailData.supplierRef = supplierRef;
    if (supplierError) emailData.supplierHoldFailed = true;

    sendBookingReceivedNotifications(emailData).catch(() => {
      /* non-blocking */
    });

    const productLabel = data.product_title || data.product_type;
    await supabase.from("inquiries").insert({
      type: "booking",
      name: data.customer_name,
      email: data.customer_email || null,
      phone: data.customer_phone,
      service: productLabel,
      passengers: data.passengers,
      budget: data.quoted_price,
      message: `Booking request #${booking.id.slice(0, 8)} - ${productLabel}. Passengers: ${data.passenger_details.names || data.passengers}. ${supplierError ? "Supplier hold needs admin retry." : supplierHeld ? "Seats held at supplier." : "Awaiting supplier hold."}`,
      source_page: data.source_page || "/",
      status: "new",
    });

    return NextResponse.json({
      success: true,
      bookingRef: booking.id,
      supplierHeld,
      supplierRef: supplierRef || null,
      message:
        "Booking request submitted. Redirecting you to WhatsApp to complete payment.",
      whatsapp: {
        productTitle: productLabel,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        passengers: data.passengers,
        quotedPrice: data.quoted_price,
        currency: data.currency,
        supplierRef: supplierRef || null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
