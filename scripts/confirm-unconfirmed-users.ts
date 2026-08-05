/**
 * One-off ops: confirm Auth users stuck on "Email not confirmed"
 * after apex/www redirect issues. Uses SUPABASE_SERVICE_ROLE_KEY.
 *
 *   npx tsx scripts/confirm-unconfirmed-users.ts
 *   npx tsx scripts/confirm-unconfirmed-users.ts --dry-run
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

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
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  }
}

async function main() {
  loadEnv();
  const dry = process.argv.includes("--dry-run");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let page = 1;
  let confirmed = 0;
  let already = 0;
  const perPage = 200;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    if (!users.length) break;

    for (const user of users) {
      if (user.email_confirmed_at) {
        already += 1;
        continue;
      }
      console.log(`${dry ? "WOULD_CONFIRM" : "CONFIRM"} ${user.email} (${user.id})`);
      if (!dry) {
        const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });
        if (updErr) {
          console.error(`  FAIL ${user.email}: ${updErr.message}`);
          continue;
        }
      }
      confirmed += 1;
    }

    if (users.length < perPage) break;
    page += 1;
  }

  console.log(JSON.stringify({ dry, confirmed, alreadyOk: already }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
