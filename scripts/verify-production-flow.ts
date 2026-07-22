/**
 * End-to-end production verification:
 * 1. Production site reachable
 * 2. Supabase has live ticket inventory
 * 3. Supplier hold works for a real group ticket
 *
 * Run: npm run verify-production
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { loadEnv } from "./load-env";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { attemptSupplierHold } from "@/lib/booking/supplier-hold";
import { isTravelLineConfigured } from "@/lib/travelline/env";

loadEnv();

const PRODUCTION_URL = (
  process.env.VERIFY_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://flywithalqibla.com"
).replace(/\/$/, "");
// Prefer the public production host for this check when local .env points at localhost.
const SITE_CHECK_URL = PRODUCTION_URL.includes("localhost")
  ? "https://flywithalqibla.com"
  : PRODUCTION_URL;

async function checkProductionSite() {
  try {
    const res = await fetch(`${SITE_CHECK_URL}/available-tickets/`, { redirect: "follow" });
    const html = await res.text();
    const hasTickets = /group tickets|Available Tickets|Book Request|Book Now/i.test(html);
    return { ok: res.ok, status: res.status, hasTickets, url: SITE_CHECK_URL };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      hasTickets: false,
      url: PRODUCTION_URL,
      error: error instanceof Error ? error.message : "fetch failed",
    };
  }
}

async function checkInventory() {
  if (!isSupabaseConfigured()) {
    return { ok: false, count: 0, sample: null, error: "Supabase not configured" };
  }

  const supabase = createAdminClient();
  const { data, count, error } = await supabase
    .from("tickets")
    .select("id, external_id, airline, flight_number, from_code, to_code, from_city, to_city, departure_date, seats_left, price", { count: "exact" })
    .eq("active", true)
    .in("from_code", ["ISB", "LHE", "KHI", "PEW", "SKT", "MUX"])
    .order("departure_date", { ascending: false })
    .limit(5);

  if (error) return { ok: false, count: 0, sample: null, error: error.message };

  const sample = data?.[0] || null;
  return { ok: (count ?? 0) > 0, count: count ?? 0, sample, error: null };
}

async function testSupplierHold(externalId: string, price: number) {
  if (!isTravelLineConfigured() || !isSupabaseConfigured()) {
    return { ok: false, skipped: true, reason: "Travel Line or Supabase not configured" };
  }

  const supabase = createAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      status: "pending_payment",
      product_type: "ticket",
      external_product_id: externalId,
      customer_name: "Production Verify Test",
      customer_phone: "03359945722",
      customer_email: "verify@alqibla.test",
      passenger_details: { names: "VERIFY TEST", passportNo: "AB1234567", nationality: "PK", dob: "1990-01-01" },
      passengers: 1,
      quoted_price: price,
      currency: "PKR",
      source_page: "/verify-production/",
    })
    .select("id")
    .single();

  if (error || !booking) {
    return { ok: false, skipped: false, reason: error?.message || "Could not create test booking row" };
  }

  const hold = await attemptSupplierHold(booking.id, {
    externalProductId: externalId,
    productType: "ticket",
    passengers: 1,
    passengerDetails: { names: "VERIFY TEST", passportNo: "AB1234567", nationality: "PK", dob: "1990-01-01" },
    quotedPrice: price,
    currency: "PKR",
  });

  const { data: updated } = await supabase
    .from("bookings")
    .select("supplier_hold_status, travelline_booking_ref, supplier_hold_error")
    .eq("id", booking.id)
    .single();

  return {
    ok: hold.held,
    bookingId: booking.id,
    supplierRef: hold.bookingRef || updated?.travelline_booking_ref,
    holdStatus: updated?.supplier_hold_status,
    error: hold.error || updated?.supplier_hold_error,
    skipped: false,
  };
}

async function main() {
  const outputDir = join(process.cwd(), "tmp", "production-verify");
  mkdirSync(outputDir, { recursive: true });

  console.log("\n=== Production Flow Verification ===\n");

  const site = await checkProductionSite();
  console.log("[1] Production site", site);

  const inventory = await checkInventory();
  console.log("[2] Ticket inventory", {
    ok: inventory.ok,
    count: inventory.count,
    sample: inventory.sample
      ? `${inventory.sample.airline} ${inventory.sample.flight_number} ${inventory.sample.from_code}→${inventory.sample.to_code} (${inventory.sample.departure_date})`
      : null,
    error: inventory.error,
  });

  let holdResult: Awaited<ReturnType<typeof testSupplierHold>> | null = null;
  if (inventory.sample?.external_id) {
    holdResult = await testSupplierHold(
      String(inventory.sample.external_id),
      Number(inventory.sample.price || 0)
    );
    console.log("[3] Supplier hold", holdResult);
    if (holdResult.supplierRef) {
      console.log(`\n⚠ Cancel test hold ${holdResult.supplierRef} in Travel Line admin.\n`);
    }
  } else {
    console.log("[3] Supplier hold skipped — no ticket with external_id");
  }

  const report = { at: new Date().toISOString(), site, inventory, hold: holdResult };
  writeFileSync(join(outputDir, "report.json"), JSON.stringify(report, null, 2));

  const passed = inventory.ok && Boolean(holdResult?.ok);
  console.log(passed ? "\n✓ Production verification passed\n" : "\n✗ Production verification failed\n");
  if (!passed) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
