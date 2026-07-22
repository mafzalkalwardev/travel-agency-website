/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Sync .env vars to Vercel (never commits secrets to git).
 * Run: node scripts/sync-vercel-env.js
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
const productionUrl = "https://al-qibla-air-services.vercel.app";

const optionalVars = {
  CRON_SECRET: env.CRON_SECRET,
  TRAVELLINE_AGENT_USERNAME: env.TRAVELLINE_AGENT_USERNAME,
  TRAVELLINE_AGENT_PASSWORD: env.TRAVELLINE_AGENT_PASSWORD,
  TRAVELLINE_BASE_URL: env.TRAVELLINE_BASE_URL || "https://travellinetour.com",
  TRAVELLINE_ADMIN_URL: env.TRAVELLINE_ADMIN_URL || "https://admin.travellinetour.com",
  TRAVELLINE_FLIGHTS_API_PATH: env.TRAVELLINE_FLIGHTS_API_PATH || "/api/flights",
  TRAVELLINE_UMRAH_API_PATH: env.TRAVELLINE_UMRAH_API_PATH || "/api/umrah-packages",
  TRAVELLINE_TOURS_API_PATH: env.TRAVELLINE_TOURS_API_PATH || "/api/tour-packages",
  TRAVELLINE_PROMOS_API_PATH: env.TRAVELLINE_PROMOS_API_PATH || "/api/promos",
  TRAVELLINE_PRICE_MARKUP_PERCENT: env.TRAVELLINE_PRICE_MARKUP_PERCENT || "0",
  TRAVELLINE_USE_PLAYWRIGHT: env.TRAVELLINE_USE_PLAYWRIGHT || "false",
  RESEND_API_KEY: env.RESEND_API_KEY,
  BOOKING_FROM_EMAIL: env.BOOKING_FROM_EMAIL,
  AUTH_FROM_EMAIL: env.AUTH_FROM_EMAIL || env.BOOKING_FROM_EMAIL,
  BOOKING_ADMIN_EMAIL: env.BOOKING_ADMIN_EMAIL || env.ADMIN_EMAIL || "salesalqibla@gmail.com",
  RESEND_SANDBOX_MODE: env.RESEND_SANDBOX_MODE,;

const vars = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SITE_URL: productionUrl,
  NEXT_PUBLIC_WHATSAPP_NUMBER: env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923315576169",
  NEXT_PUBLIC_BASE_PATH: env.NEXT_PUBLIC_BASE_PATH || "",
  ADMIN_EMAIL: env.ADMIN_EMAIL || "salesalqibla@gmail.com",
  ADMIN_PASSWORD: env.ADMIN_PASSWORD,
  ...optionalVars,
};

const missing = Object.entries(vars).filter(
  ([k, v]) =>
    !v &&
    k !== "NEXT_PUBLIC_BASE_PATH" &&
    !k.startsWith("TRAVELLINE_") &&
    k !== "CRON_SECRET"
);
if (missing.length) {
  console.error("Missing env values:", missing.map(([k]) => k).join(", "));
  process.exit(1);
}

const targets = ["production"];

function addEnv(name, value, target) {
  try {
    execSync(`npx vercel env rm ${name} ${target} --yes`, {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
    });
  } catch {
    /* not set yet */
  }
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, target, "--value", value, "--yes"],
    { cwd: path.join(__dirname, ".."), stdio: "inherit", shell: true }
  );
  if (result.status !== 0) throw new Error(`Failed to set ${name} for ${target}`);
  console.log(`✓ ${name} → ${target}`);
}

for (const [name, value] of Object.entries(vars)) {
  if (!value) continue;
  for (const target of targets) {
    addEnv(name, value, target);
  }
}

console.log("\nVercel env synced. Redeploy with: npx vercel --prod");
