import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { INVENTORY_CACHE_TAG } from "@/lib/inventory-public-cache";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") return false;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

/**
 * Called after inventory sync (GitHub Actions) so public pages refresh
 * without every visitor querying Supabase.
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(INVENTORY_CACHE_TAG, "max");
  return NextResponse.json({
    ok: true,
    revalidated: INVENTORY_CACHE_TAG,
    at: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return POST(request);
}
