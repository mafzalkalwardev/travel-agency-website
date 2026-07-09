import { loadEnv } from "./load-env";
import { TravelLineTicketProvider } from "@/lib/tickets/providers/travelLineProvider";
import { syncTravelLinePackages } from "@/lib/sync/sync-packages";

loadEnv();

async function main() {
  const provider = new TravelLineTicketProvider();
  const [tickets, packages] = await Promise.all([
    provider.sync(),
    syncTravelLinePackages(),
  ]);

  console.log(
    JSON.stringify(
      {
        tickets,
        packages,
        at: new Date().toISOString(),
      },
      null,
      2
    )
  );

  if (tickets.status === "failed") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
