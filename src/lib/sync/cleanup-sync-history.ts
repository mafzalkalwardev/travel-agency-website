import { createAdminClient } from "@/lib/supabase/admin";

export type SyncHistoryCleanupResult = {
  syncChangesDeleted: number;
  syncLogsDeleted: number;
  notificationLogsDeleted: number;
  keepDays: number;
};

/**
 * Prune old sync/audit rows so Supabase free-tier storage stays healthy.
 * Keeps recent history for the admin UI; older rows are disposable.
 */
export async function cleanupSyncHistory(keepDays = 14): Promise<SyncHistoryCleanupResult> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000).toISOString();

  // Delete child rows first (sync_changes → sync_logs).
  const { data: oldChanges, error: changesErr } = await supabase
    .from("sync_changes")
    .delete()
    .lt("created_at", cutoff)
    .select("id");

  if (changesErr) throw new Error(`sync_changes cleanup failed: ${changesErr.message}`);

  const { data: oldLogs, error: logsErr } = await supabase
    .from("sync_logs")
    .delete()
    .lt("created_at", cutoff)
    .select("id");

  if (logsErr) throw new Error(`sync_logs cleanup failed: ${logsErr.message}`);

  let notificationLogsDeleted = 0;
  try {
    const { data: oldNotes, error: notesErr } = await supabase
      .from("notification_log")
      .delete()
      .lt("created_at", cutoff)
      .select("id");
    if (!notesErr) notificationLogsDeleted = oldNotes?.length ?? 0;
  } catch {
    /* table may not exist on older DBs */
  }

  return {
    syncChangesDeleted: oldChanges?.length ?? 0,
    syncLogsDeleted: oldLogs?.length ?? 0,
    notificationLogsDeleted,
    keepDays,
  };
}
