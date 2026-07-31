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

  if (!ticketOutcome.skipped && ticketOutcome.result.status === "failed") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
