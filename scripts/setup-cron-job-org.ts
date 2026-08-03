/**
 * Manage cron-job.org jobs for Al Qibla sync.
 * Uses CRONJOB_ORG_API_KEY from .env / .env.local (never commit).
 *
 * Heavy inventory sync must NOT hit Vercel every 15 min (Hobby CPU pause).
 * Prefer GitHub Actions on the public repo. This script disables Vercel-hitting
 * sync jobs and keeps/creates a light once-daily cleanup job only.
 */
import { readFileSync, existsSync, appendFileSync } from "fs";
import { join } from "path";

const API = "https://api.cron-job.org";
const SITE = "https://www.flywithalqibla.com";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = join(process.cwd(), name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (name === ".env.local" || !process.env[m[1]]) process.env[m[1]] = v;
    }
  }
}

function ensureApiKeyInEnvLocal(keyFromArg?: string) {
  const key = keyFromArg || process.env.CRONJOB_ORG_API_KEY;
  if (!key) throw new Error("CRONJOB_ORG_API_KEY missing");
  const localPath = join(process.cwd(), ".env.local");
  let existing = existsSync(localPath) ? readFileSync(localPath, "utf8") : "";
  if (!/^CRONJOB_ORG_API_KEY=/m.test(existing)) {
    appendFileSync(
      localPath,
      `${existing.endsWith("\n") || !existing ? "" : "\n"}CRONJOB_ORG_API_KEY=${key}\n`
    );
  }
  process.env.CRONJOB_ORG_API_KEY = key;
  return key;
}

async function api(method: string, path: string, body?: unknown) {
  const key = process.env.CRONJOB_ORG_API_KEY!;
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  }
  return json as Record<string, unknown>;
}

type Job = {
  jobId: number;
  enabled: boolean;
  title?: string;
  url: string;
};

async function main() {
  loadEnv();
  const argKey = process.argv[2];
  ensureApiKeyInEnvLocal(argKey);

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) throw new Error("CRON_SECRET missing in .env (needed for cleanup job header)");

  const listed = (await api("GET", "/jobs")) as {
    jobs?: Job[];
    jobDetails?: Job[];
  };
  const jobs = (listed.jobs || listed.jobDetails || []) as Job[];
  console.log(
    "Existing jobs:",
    jobs.map((j) => ({ id: j.jobId, enabled: j.enabled, url: j.url }))
  );

  const authHeaders = { Authorization: `Bearer ${cronSecret}` };

  for (const job of jobs) {
    const url = (job.url || "").toLowerCase();
    const isHeavySync =
      url.includes("/api/cron/sync-tickets") || url.includes("/api/cron/sync-packages");

    if (isHeavySync) {
      console.log(`Disabling Vercel-hitting sync job ${job.jobId} (${job.url})`);
      await api("PATCH", `/jobs/${job.jobId}`, {
        job: { enabled: false },
      });
    }
  }

  // Ensure once-daily cleanup still hits Vercel (cheap).
  const cleanupUrl = `${SITE}/api/cron/cleanup-maintenance/`;
  const cleanup = jobs.find((j) => (j.url || "").includes("/api/cron/cleanup-maintenance"));
  const dailySchedule = {
    timezone: "UTC",
    expiresAt: 0,
    hours: [5],
    minutes: [0],
    mdays: [-1],
    months: [-1],
    wdays: [-1],
  };

  if (cleanup) {
    console.log(`Updating cleanup job ${cleanup.jobId}`);
    await api("PATCH", `/jobs/${cleanup.jobId}`, {
      job: {
        enabled: true,
        url: cleanupUrl,
        title: "Daily maintenance cleanup",
        requestMethod: 0, // GET
        saveResponses: false,
        headers: authHeaders,
        schedule: dailySchedule,
      },
    });
  } else {
    console.log("Creating daily cleanup job");
    await api("PUT", "/jobs", {
      job: {
        enabled: true,
        url: cleanupUrl,
        title: "Daily maintenance cleanup",
        requestMethod: 0,
        saveResponses: false,
        headers: authHeaders,
        schedule: dailySchedule,
      },
    });
  }

  const after = (await api("GET", "/jobs")) as { jobs?: Job[]; jobDetails?: Job[] };
  const finalJobs = after.jobs || after.jobDetails || [];
  console.log(
    "Final jobs:",
    finalJobs.map((j) => ({ id: j.jobId, enabled: j.enabled, url: j.url }))
  );
  console.log(
    "\nDone. Heavy sync must run on GitHub Actions every 15 min (public repo), not Vercel."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
