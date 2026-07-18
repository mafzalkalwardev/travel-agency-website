import { loadEnv } from "./load-env";
import { runTicketSync } from "@/lib/sync/run-ticket-sync";
import { syncTravelLinePackages } from "@/lib/sync/sync-packages";

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
