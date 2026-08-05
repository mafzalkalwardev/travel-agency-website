/**
 * Manage cron-job.org jobs for Al Qibla.
 *
 * Real ~5-minute inventory sync:
 *   cron-job.org → GitHub workflow_dispatch (Inventory Ticket Sync)
 *   Never scrape TravelLine on Vercel (Hobby CPU).
 *
 * Requires in .env / .env.local:
 *   CRONJOB_ORG_API_KEY
 *   GH_DISPATCH_TOKEN  (classic PAT with "workflow" scope, or fine-grained
 *                       Actions: Write on this repo)
 *   CRON_SECRET        (daily Vercel cleanup only)
 *
 * Usage: npx tsx scripts/setup-cron-job-org.ts
 */
import { readFileSync, existsSync, appendFileSync } from "fs";
import { join } from "path";

const API = "https://api.cron-job.org";
const SITE = "https://www.flywithalqibla.com";
const REPO = "mafzalkalwardev/travel-agency-website";
const WORKFLOW_FILE = "travelline-sync.yml";
const DISPATCH_URL = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

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

async function verifyGithubDispatch(token: string) {
  const res = await fetch(DISPATCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "al-qibla-cron-setup",
    },
    body: JSON.stringify({ ref: "main" }),
  });
  if (res.status !== 204 && res.status !== 200) {
    const text = await res.text();
    throw new Error(
      `GitHub workflow_dispatch failed HTTP ${res.status}: ${text.slice(0, 300)}. ` +
        `Need a PAT with workflow scope (classic) or Actions: Write (fine-grained).`
    );
  }
}

async function main() {
  loadEnv();
  const argKey = process.argv[2];
  ensureApiKeyInEnvLocal(argKey);

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) throw new Error("CRON_SECRET missing in .env (needed for cleanup job header)");

  const dispatchToken =
    process.env.GH_DISPATCH_TOKEN ||
    process.env.GITHUB_DISPATCH_TOKEN ||
    process.env.GH_PAT;

  const listed = (await api("GET", "/jobs")) as {
    jobs?: Job[];
    jobDetails?: Job[];
  };
  const jobs = (listed.jobs || listed.jobDetails || []) as Job[];
  console.log(
    "Existing jobs:",
    jobs.map((j) => ({ id: j.jobId, enabled: j.enabled, title: j.title, url: j.url }))
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

  // --- Real 5-minute sync: dispatch GitHub Actions (not Vercel) ---
  if (dispatchToken) {
    console.log("Verifying GH_DISPATCH_TOKEN can trigger Inventory Ticket Sync...");
    await verifyGithubDispatch(dispatchToken);
    console.log("Dispatch OK.");

    const everyFive = {
      timezone: "UTC",
      expiresAt: 0,
      hours: [-1],
      minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
      mdays: [-1],
      months: [-1],
      wdays: [-1],
    };

    const dispatchJob = {
      enabled: true,
      url: DISPATCH_URL,
      title: "Inventory sync dispatch (GitHub every 5 min)",
      requestMethod: 1, // POST
      saveResponses: true,
      headers: {
        Authorization: `Bearer ${dispatchToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "cron-job-org-al-qibla",
      },
      extendedData: {
        headers: {
          Authorization: `Bearer ${dispatchToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "cron-job-org-al-qibla",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main" }),
      },
      schedule: everyFive,
    };

    const existingDispatch = jobs.find(
      (j) =>
        (j.url || "").includes("/actions/workflows/") ||
        (j.title || "").toLowerCase().includes("inventory sync dispatch")
    );

    if (existingDispatch) {
      console.log(`Updating GitHub dispatch job ${existingDispatch.jobId}`);
      await api("PATCH", `/jobs/${existingDispatch.jobId}`, { job: dispatchJob });
    } else {
      console.log("Creating GitHub dispatch job (every 5 minutes)");
      await api("PUT", "/jobs", { job: dispatchJob });
    }
  } else {
    console.warn(
      "\nGH_DISPATCH_TOKEN missing — skipped 5-min GitHub dispatch job.\n" +
        "Create a classic PAT (scope: workflow) or fine-grained (Actions: Write),\n" +
        "add GH_DISPATCH_TOKEN=... to .env.local, then re-run this script.\n"
    );
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
    finalJobs.map((j) => ({ id: j.jobId, enabled: j.enabled, title: j.title, url: j.url }))
  );
  console.log(
    "\nDone. Inventory scrape stays on GitHub Actions; cron-job.org only dispatches it."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
