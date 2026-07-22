import { NextResponse } from "next/server";
import { runTicketSync } from "@/lib/sync/run-ticket-sync";

export const dynamic = "force-dynamic";
// Bumped from 120s: sync duration was regularly hitting that ceiling as
// inventory grew, causing FUNCTION_INVOCATION_TIMEOUT — which hard-kills
// the process before the lock-release `finally` block can run. See
// docs/REDESIGN.md §7 and the fetchTravelLineGroupFlights parallelization
// in this same fix, which should keep real runs well under this ceiling.
export const maxDuration = 180;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is required" }, { status: 500 });
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const outcome = await runTicketSync();
    if (outcome.skipped) {
      return NextResponse.json({ status: "skipped", message: outcome.reason });
    }
    return NextResponse.json({ ...outcome.result, lastSyncedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}
