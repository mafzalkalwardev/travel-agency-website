/**
 * Deactivate return-leg and wrong-direction tickets in Supabase.
 * Run: npm run cleanup-tickets
 */
import { loadEnv } from "./load-env";
import { cleanupReturnLegTickets } from "@/lib/sync/cleanup-return-tickets";

loadEnv();

async function main() {
  const result = await cleanupReturnLegTickets();
  console.log(JSON.stringify(result, null, 2));
  if (result.deactivated === 0) {
    console.log("Nothing to clean up.");
  } else {
    console.log(`Deactivated ${result.deactivated} tickets.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
