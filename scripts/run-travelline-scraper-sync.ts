import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runTicketSync } from "@/lib/sync/run-ticket-sync";
import { syncTravelLinePackages } from "@/lib/sync/sync-packages";

/** Load local .env files when present; CI supplies secrets via process.env. */
function loadEnv() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (const file of [".env.local", ".env"]) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim();
    }
  }
}

loadEnv();

async function pingRevalidate() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.flywithalqibla.com").replace(
    /\/$/,
    ""
  );
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("CRON_SECRET missing — skip inventory revalidate ping");
    return;
  }
  const res = await fetch(`${site}/api/cron/revalidate-inventory/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log("revalidate", res.status, body.slice(0, 200));
}

async function main() {
  const [ticketOutcome, packages] = await Promise.all([
    runTicketSync(),
    syncTravelLinePackages(),
  ]);

  console.log(
    JSON.stringify(
      {
        tickets: ticketOutcome,
        packages,
        at: new Date().toISOString(),
      },
      null,
      2
    )
  );

  const ticketsFailed =
    !ticketOutcome.skipped && ticketOutcome.result.status === "failed";
  const ticketsOk =
    !ticketOutcome.skipped && ticketOutcome.result.status !== "failed";
  const packagesFailed = packages.status === "failed";

  // Ticket sync is the critical path for the public mirror. Package-only
  // failures (or empty seasonal feeds) must not block publish/revalidate.
  if (ticketsOk) {
    await pingRevalidate().catch((e) => console.warn("revalidate failed", e));
  }

  if (ticketsFailed) {
    process.exitCode = 1;
    return;
  }
  if (packagesFailed && !ticketsOk) {
    process.exitCode = 1;
    return;
  }
  if (packagesFailed) {
    console.warn("packages sync failed; ticket sync succeeded — continuing for mirror publish");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
