/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require("child_process");
const { loadEnv } = require("./load-env");

loadEnv();

const secrets = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  TRAVELLINE_BASE_URL: process.env.TRAVELLINE_BASE_URL || "https://travellinetour.com",
  TRAVELLINE_ADMIN_URL: process.env.TRAVELLINE_ADMIN_URL || "https://admin.travellinetour.com",
  TRAVELLINE_AGENT_USERNAME: process.env.TRAVELLINE_AGENT_USERNAME,
  TRAVELLINE_AGENT_PASSWORD: process.env.TRAVELLINE_AGENT_PASSWORD,
};

for (const [name, value] of Object.entries(secrets)) {
  if (!value) {
    console.error(`Missing ${name}`);
    process.exitCode = 1;
    continue;
  }
  const result = spawnSync("gh", ["secret", "set", name, "--body", value], {
    stdio: "inherit",
    shell: true,
  });
  if (result.status === 0) {
    console.log(`✓ GitHub secret set: ${name}`);
  } else {
    console.error(`✗ Failed: ${name}`);
    process.exitCode = 1;
  }
}
