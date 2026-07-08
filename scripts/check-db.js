/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(__dirname, "..", file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
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

const tables = [
  "profiles",
  "customer_profiles",
  "tickets",
  "bookings",
  "integration_sessions",
  "sync_logs",
  "sync_changes",
  "umrah_packages",
  "inquiries",
];

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results = {};
  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    results[table] = error ? `MISSING: ${error.message}` : "OK";
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
