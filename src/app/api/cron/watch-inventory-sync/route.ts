import { NextResponse } from "next/server";
import { checkInventoryHealth } from "@/lib/sync/check-inventory-health";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") return false;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

/**
 * Light watchdog: checks GitHub inventory-cache mirror age.
 * Triggered by GitHub Actions every ~20 minutes (not a heavy scrape).
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkInventoryHealth();
    return NextResponse.json({
      status: result.ok ? "success" : "stale",
      ...result,
      at: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "failed",
        error: e instanceof Error ? e.message : "Inventory health check failed",
      },
      { status: 500 }
    );
  }
}
