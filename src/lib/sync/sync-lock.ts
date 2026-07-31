import { createAdminClient } from "@/lib/supabase/admin";

// Vercel hard-kills the sync function at maxDuration (currently 180s), and a
// kill like that skips the `finally` block that would otherwise release the
// lock. Keep the stale window ABOVE maxDuration so a healthy long sync is
// never stolen mid-run, but still auto-recovers if the process is killed
// without releasing.
const STALE_LOCK_MS = 210 * 1000;

/**
 * Best-effort lock to stop overlapping sync runs once the 1-minute
 * external scheduler is live — a sync currently takes ~110s (see
 * docs/REDESIGN.md §7), close enough to the 60s gap between runs that
 * two could otherwise overlap. Not a true distributed lock (no atomic
 * compare-and-swap via the JS client), but good enough for a single
 * external cron caller: worst case on a race is one extra sync run, not
 * data corruption (upserts are idempotent).
 */
export async function acquireSyncLock(provider: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("sync_locks")
    .select("locked_at")
    .eq("provider", provider)
    .maybeSingle();

  if (existing) {
    const age = Date.now() - new Date(existing.locked_at).getTime();
    if (age < STALE_LOCK_MS) return false; // still held, not stale
  }

  const { error } = await supabase
    .from("sync_locks")
    .upsert({ provider, locked_at: new Date().toISOString() }, { onConflict: "provider" });

  return !error;
}

export async function releaseSyncLock(provider: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("sync_locks").delete().eq("provider", provider);
}
