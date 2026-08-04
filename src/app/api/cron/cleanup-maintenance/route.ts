import { NextResponse } from "next/server";
import { cleanupSyncHistory } from "@/lib/sync/cleanup-sync-history";
import { cleanupStaleBookings } from "@/lib/booking/cleanup-stale-bookings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") return false;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

/** Daily maintenance: prune sync history + expire stale unpaid booking shells. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [history, staleBookings] = await Promise.all([
      cleanupSyncHistory(7),
      cleanupStaleBookings(),
    ]);

    return NextResponse.json({
      status: "success",
      history,
      staleBookings,
      at: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { status: "failed", error: e instanceof Error ? e.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
