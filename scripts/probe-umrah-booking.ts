/**
 * Probe Travel Line umrah package booking API.
 * Run: npx tsx scripts/probe-umrah-booking.ts
 */
import { loadEnv } from "./load-env";
import { getTravelLineClient } from "@/lib/travelline/client";
import { getTravelLineConfig } from "@/lib/travelline/env";

loadEnv();

async function main() {
  const client = getTravelLineClient();
  const { username } = getTravelLineConfig();

  const items = await client.fetchUmrahApiItems();
  const sample = items.find((p) => p.slug && p.id) || items[0];
  if (!sample) {
    console.error("No umrah packages found");
    process.exit(1);
  }

  console.log("Sample package:", {
    id: sample.id,
    slug: sample.slug,
    title: sample.title,
    departureFlightNo: sample.departureFlightNo,
  });

  const session = await client.ensureSession();
  console.log("Session:", session ? "ok" : "failed");

  const result = await client.createBooking({
    externalProductId: sample.id,
    productType: "umrah",
    passengers: 1,
    passengerDetails: { names: "UMRAH PROBE TEST" },
    quotedPrice: sample.price || 100000,
    currency: "PKR",
  });

  console.log("Booking result:", JSON.stringify(result, null, 2));

  if (result.success && result.bookingRef) {
    console.log("\n⚠ Cancel this test hold in Travel Line admin:", result.bookingRef);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
