import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { notifyAdminActivity } from "@/lib/email/notify-admin";
import { inventoryStaleAdminHtml } from "@/lib/email/templates";
import { SITE } from "@/lib/constants";

const WATCH_PROVIDER = "inventory-watch";
/** GitHub cron schedules are often delayed 1–3h; only email when truly stuck. */
const DEFAULT_STALE_MINUTES = 180;
const DEFAULT_COOLDOWN_HOURS = 12;

function mirrorUrl() {
  return (
    process.env.INVENTORY_MIRROR_URL ||
    "https://raw.githubusercontent.com/mafzalkalwardev/travel-agency-inventory-cache/main/public-inventory.json"
  );
}

function staleMinutes() {
  const n = Number(process.env.INVENTORY_STALE_MINUTES || DEFAULT_STALE_MINUTES);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_STALE_MINUTES;
}

function cooldownHours() {
  const n = Number(process.env.INVENTORY_ALERT_COOLDOWN_HOURS || DEFAULT_COOLDOWN_HOURS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_COOLDOWN_HOURS;
}

async function fetchMirrorMeta() {
  const res = await fetch(mirrorUrl(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    return { ok: false as const, status: res.status, updatedAt: null as string | null, ticketCount: 0 };
  }
  const json = (await res.json()) as {
    updatedAt?: string;
    tickets?: unknown[];
  };
  return {
    ok: true as const,
    status: res.status,
    updatedAt: typeof json.updatedAt === "string" ? json.updatedAt : null,
    ticketCount: Array.isArray(json.tickets) ? json.tickets.length : 0,
  };
}

async function lastWatchAlertAt(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("sync_logs")
      .select("completed_at")
      .eq("provider", WATCH_PROVIDER)
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.completed_at ?? null;
  } catch {
    return null;
  }
}

async function recordWatchAlert(message: string) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createAdminClient();
    await supabase.from("sync_logs").insert({
      provider: WATCH_PROVIDER,
      status: "failed",
      tickets_processed: 0,
      tickets_created: 0,
      tickets_updated: 0,
      tickets_deactivated: 0,
      message,
      completed_at: new Date().toISOString(),
    });
  } catch {
    /* non-fatal */
  }
}

export type InventoryHealthResult = {
  ok: boolean;
  stale: boolean;
  alerted: boolean;
  suppressed: boolean;
  ageMinutes: number | null;
  thresholdMinutes: number;
  updatedAt: string | null;
  ticketCount: number;
  message: string;
};

/** Light check of the public inventory mirror; emails admin if stale (6h cooldown). */
export async function checkInventoryHealth(): Promise<InventoryHealthResult> {
  const thresholdMinutes = staleMinutes();
  const cooldownMs = cooldownHours() * 60 * 60 * 1000;

  let mirror;
  try {
    mirror = await fetchMirrorMeta();
  } catch (e) {
    mirror = {
      ok: false as const,
      status: 0,
      updatedAt: null as string | null,
      ticketCount: 0,
      error: e instanceof Error ? e.message : "mirror fetch failed",
    };
  }

  const updatedAt = mirror.updatedAt;
  const updatedMs = updatedAt ? Date.parse(updatedAt) : NaN;
  const ageMinutes =
    Number.isFinite(updatedMs) ? Math.round((Date.now() - updatedMs) / 60000) : null;

  const missingOrUnreadable = !mirror.ok || !updatedAt || !Number.isFinite(updatedMs);
  const stale =
    missingOrUnreadable || (ageMinutes !== null && ageMinutes > thresholdMinutes);

  if (!stale) {
    return {
      ok: true,
      stale: false,
      alerted: false,
      suppressed: false,
      ageMinutes,
      thresholdMinutes,
      updatedAt,
      ticketCount: mirror.ticketCount,
      message: `Mirror fresh (${ageMinutes}m old, ${mirror.ticketCount} tickets)`,
    };
  }

  const reason = missingOrUnreadable
    ? `Inventory mirror missing or unreadable (HTTP ${"status" in mirror ? mirror.status : "?"}${
        "error" in mirror && mirror.error ? `: ${mirror.error}` : ""
      })`
    : `Inventory mirror is ${ageMinutes} minutes old (threshold ${thresholdMinutes}m). Site may show stale tickets.`;

  const lastAlert = await lastWatchAlertAt();
  const lastAlertMs = lastAlert ? Date.parse(lastAlert) : NaN;
  const withinCooldown =
    Number.isFinite(lastAlertMs) && Date.now() - lastAlertMs < cooldownMs;

  if (withinCooldown) {
    return {
      ok: false,
      stale: true,
      alerted: false,
      suppressed: true,
      ageMinutes,
      thresholdMinutes,
      updatedAt,
      ticketCount: mirror.ticketCount,
      message: `${reason} Alert suppressed (cooldown ${cooldownHours()}h).`,
    };
  }

  const actionsUrl =
    "https://github.com/mafzalkalwardev/travel-agency-website/actions/workflows/travelline-sync.yml";

  const email = await notifyAdminActivity({
    subject: `[${SITE.name}] Inventory sync stale (${ageMinutes ?? "?"}m)`,
    html: inventoryStaleAdminHtml({
      ageMinutes,
      thresholdMinutes,
      updatedAt,
      ticketCount: mirror.ticketCount,
      reason,
      actionsUrl,
      mirrorUrl: mirrorUrl(),
    }),
  });

  await recordWatchAlert(reason);

  return {
    ok: false,
    stale: true,
    alerted: Boolean(email.ok),
    suppressed: false,
    ageMinutes,
    thresholdMinutes,
    updatedAt,
    ticketCount: mirror.ticketCount,
    message: email.ok
      ? `${reason} Admin email sent.`
      : `${reason} Email ${email.skipped ? "skipped" : "failed"}: ${email.error || "unknown"}`,
  };
}
