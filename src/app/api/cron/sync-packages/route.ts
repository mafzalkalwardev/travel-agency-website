import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { writeSyncLog } from "@/lib/sync/log-sync";
import { syncTravelLinePackages } from "@/lib/sync/sync-packages";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is required" }, { status: 500 });
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncTravelLinePackages();

  if (isSupabaseConfigured()) {
    await writeSyncLog({
      provider: result.provider,
      status: result.status,
      processed: result.umrahProcessed + result.toursProcessed,
      created: (result.umrahCreated || 0) + (result.toursCreated || 0),
      updated: (result.umrahUpdated || 0) + (result.toursUpdated || 0),
      deactivated: (result.umrahDeactivated || 0) + (result.toursDeactivated || 0),
      message: result.message,
      changes: result.changes,
    });
  }

  const body = {
    ...result,
    lastSyncedAt: new Date().toISOString(),
  };
  if (result.status === "failed") {
    return NextResponse.json(body, { status: 502 });
  }
  return NextResponse.json(body);
}
