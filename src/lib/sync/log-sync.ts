import { createAdminClient } from "@/lib/supabase/admin";
import type { SyncChange } from "@/lib/tickets/providers/types";

export interface SyncLogInput {
  provider: string;
  status: "success" | "partial" | "failed";
  processed: number;
  created: number;
  updated: number;
  deactivated: number;
  message?: string;
  changes?: SyncChange[];
}

/** Keep admin sync_changes readable and inserts under Vercel time/payload limits. */
const MAX_SYNC_CHANGES = 40;

function sanitizeFieldChanges(
  fieldChanges?: Record<string, { old: unknown; new: unknown }>
): Record<string, { old: unknown; new: unknown }> {
  if (!fieldChanges) return {};
  const out: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(fieldChanges)) {
    if (key === "raw_payload") continue;
    out[key] = {
      old: summarizeValue(value.old),
      new: summarizeValue(value.new),
    };
  }
  return out;
}

function summarizeValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "object") {
    try {
      const text = JSON.stringify(value);
      return text.length > 240 ? `${text.slice(0, 240)}…` : value;
    } catch {
      return "[unserializable]";
    }
  }
  if (typeof value === "string" && value.length > 240) return `${value.slice(0, 240)}…`;
  return value;
}

export async function writeSyncLog(input: SyncLogInput) {
  const supabase = createAdminClient();
  const { data: log, error } = await supabase
    .from("sync_logs")
    .insert({
      provider: input.provider,
      status: input.status,
      tickets_processed: input.processed,
      tickets_created: input.created,
      tickets_updated: input.updated,
      tickets_deactivated: input.deactivated,
      message: input.message,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !log?.id) return log;

  const changes = (input.changes || []).slice(0, MAX_SYNC_CHANGES);
  if (changes.length) {
    await supabase.from("sync_changes").insert(
      changes.map((change) => ({
        sync_log_id: log.id,
        provider: change.provider,
        entity_type: change.entityType,
        entity_id: change.entityId || null,
        external_id: change.externalId || null,
        change_type: change.changeType,
        field_changes: sanitizeFieldChanges(change.fieldChanges),
        old_value: null,
        new_value: null,
      }))
    );
  }

  return log;
}
