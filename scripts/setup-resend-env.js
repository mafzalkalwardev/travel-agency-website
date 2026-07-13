/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Push Resend booking email vars to Vercel production.
 * Requires RESEND_API_KEY in .env or .env.local (get from https://resend.com/api-keys).
 *
 * Run: node scripts/setup-resend-env.js
 */
const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");

function loadEnv() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    const filePath = path.join(__dirname, "..", file);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
const resendKey = env.RESEND_API_KEY;
const fromEmail = env.BOOKING_FROM_EMAIL || "onboarding@resend.dev";
const adminEmail = env.BOOKING_ADMIN_EMAIL || env.ADMIN_EMAIL || "salesalqibla@gmail.com";
const sandboxMode = env.RESEND_SANDBOX_MODE ?? "true";

if (!resendKey) {
  console.error(
    "RESEND_API_KEY not found in .env or .env.local.\n" +
      "1. Create a key at https://resend.com/api-keys\n" +
      "2. Verify your sender domain in Resend\n" +
      "3. Add to .env:\n" +
      "   RESEND_API_KEY=re_...\n" +
      `   BOOKING_FROM_EMAIL=${fromEmail}\n` +
      `   BOOKING_ADMIN_EMAIL=${adminEmail}\n` +
      "4. Re-run: node scripts/setup-resend-env.js"
  );
  process.exit(1);
}

const vars = {
  RESEND_API_KEY: resendKey,
  BOOKING_FROM_EMAIL: fromEmail,
  BOOKING_ADMIN_EMAIL: adminEmail,
  RESEND_SANDBOX_MODE: sandboxMode,
};

function addEnv(name, value) {
  try {
    execSync(`npx vercel env rm ${name} production --yes`, {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
    });
  } catch {
    /* not set */
  }
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, "production", "--value", value, "--yes"],
    { cwd: path.join(__dirname, ".."), stdio: "pipe", shell: true, encoding: "utf8" }
  );
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(`Failed to set ${name}${err ? `: ${err}` : ""}`);
  }
  console.log(`✓ ${name} → production`);
}

for (const [name, value] of Object.entries(vars)) {
  addEnv(name, value);
}

console.log("\nResend env synced. Redeploy production, then test at Admin → Integrations → Send test email.");
