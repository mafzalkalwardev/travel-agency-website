/**
 * GitHub Actions entry: check inventory mirror age and email admin if stale.
 * Env: SUPABASE_*, RESEND_*, BOOKING_* / ADMIN_EMAIL (optional for email)
 */
import { checkInventoryHealth } from "../src/lib/sync/check-inventory-health";

async function main() {
  const result = await checkInventoryHealth();
  console.log(JSON.stringify(result, null, 2));
  if (result.stale && !result.alerted && !result.suppressed) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
