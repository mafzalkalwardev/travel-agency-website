import { loadEnv } from "./load-env";
import { scrapeAndSaveMirror } from "@/lib/travelline-mirror/scraper";

loadEnv();

async function main() {
  const snapshot = await scrapeAndSaveMirror();
  console.log(
    JSON.stringify(
      {
        saved: "data/travelline-mirror/snapshot.json",
        scrapedAt: snapshot.scrapedAt,
        sessionOk: snapshot.sessionOk,
        counts: snapshot.counts,
      },
      null,
      2
    )
  );
  if (!snapshot.sessionOk) {
    console.warn("Warning: agent login failed — group flights may be empty. Set TRAVELLINE_AGENT_USERNAME/PASSWORD.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
