/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * While attached to the user's Chrome CDP session (already logged into Supabase):
 * 1) Create a personal access token
 * 2) PATCH Auth site URL + Resend SMTP via Management API
 *
 * Prerequisite: Chrome running with --remote-debugging-port=9222
 * Run: node scripts/apply-supabase-auth-via-cdp-api.js
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const PROJECT_REF = "gjatvtyzncpusgkpzldz";
const CDP = "http://127.0.0.1:9222";

function loadEnv() {
  const env = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const filePath = path.join(__dirname, "..", file);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in env) || env[key] === "") env[key] = value;
    }
  }
  return env;
}

function upsertEnv(key, value) {
  const filePath = path.join(__dirname, "..", ".env");
  let raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(raw)) raw = raw.replace(re, `${key}=${value}`);
  else raw = raw.replace(/\s*$/, "") + `\n${key}=${value}\n`;
  fs.writeFileSync(filePath, raw);
}

async function createAccessToken(page) {
  await page.goto("https://supabase.com/dashboard/account/tokens", {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForTimeout(4000);

  // Generate new token
  const gen = page.getByRole("button", { name: /generate|create|new token/i }).first();
  if (await gen.count()) {
    await gen.click();
    await page.waitForTimeout(1500);
  }

  // Name field
  const nameInput = page.getByLabel(/name|token name/i).first();
  if (await nameInput.count()) {
    await nameInput.fill("al-qibla-live-setup");
  } else {
    const any = page.locator("input[type='text']").first();
    if (await any.count()) await any.fill("al-qibla-live-setup");
  }

  const createBtn = page.getByRole("button", { name: /generate|create|save/i }).last();
  if (await createBtn.count()) {
    await createBtn.click();
    await page.waitForTimeout(2000);
  }

  // Token value often shown once in a code/pre/input
  const candidates = [
    page.locator("code").filter({ hasText: /^sbp_/ }),
    page.locator("input[readonly]"),
    page.locator("textarea"),
    page.getByText(/^sbp_/),
  ];

  let token = "";
  for (const loc of candidates) {
    if (!(await loc.count())) continue;
    const text = ((await loc.first().inputValue().catch(() => "")) || (await loc.first().innerText().catch(() => ""))).trim();
    const m = text.match(/sbp_[A-Za-z0-9_]+/);
    if (m) {
      token = m[0];
      break;
    }
  }

  if (!token) {
    // Broader page text scrape
    const body = await page.locator("body").innerText();
    const m = body.match(/sbp_[A-Za-z0-9_]+/);
    if (m) token = m[0];
  }

  if (!token) throw new Error("Could not capture personal access token from UI");
  return token;
}

async function patchAuth(token, env) {
  const siteUrl = "https://flywithalqibla.com";
  const fromEmail = env.AUTH_FROM_EMAIL || env.BOOKING_FROM_EMAIL || "noreply@flywithalqibla.com";
  const payload = {
    site_url: siteUrl,
    uri_allow_list: [
      siteUrl,
      `${siteUrl}/**`,
      `${siteUrl}/account/**`,
      `${siteUrl}/account/login`,
      `${siteUrl}/account/login/`,
      "http://localhost:3000",
      "http://localhost:3000/**",
      "http://localhost:3000/account/**",
    ].join(","),
    external_email_enabled: true,
    mailer_secure_email_change_enabled: true,
    mailer_autoconfirm: false,
    smtp_admin_email: fromEmail,
    smtp_host: "smtp.resend.com",
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: env.RESEND_API_KEY,
    smtp_sender_name: "Al Qibla Air Services",
  };

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Auth PATCH failed ${res.status}: ${text}`);
  const json = JSON.parse(text);
  return {
    site_url: json.site_url,
    uri_allow_list: json.uri_allow_list,
    smtp_host: json.smtp_host,
    smtp_port: json.smtp_port,
    smtp_admin_email: json.smtp_admin_email,
    smtp_sender_name: json.smtp_sender_name,
  };
}

async function main() {
  const env = loadEnv();
  if (!env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

  const ver = await fetch(`${CDP}/json/version`);
  if (!ver.ok) throw new Error("Chrome CDP not available on 9222 — restart Alqibla Chrome with debugging first");

  const browser = await chromium.connectOverCDP(CDP);
  const context = browser.contexts()[0];
  const page = context.pages().find((p) => p.url().includes("supabase.com")) || context.pages()[0] || (await context.newPage());

  console.log("Creating Supabase access token in your Chrome session...");
  const token = await createAccessToken(page);
  upsertEnv("SUPABASE_ACCESS_TOKEN", token);
  console.log("Token saved to .env (SUPABASE_ACCESS_TOKEN)");

  console.log("Patching Auth URL + Resend SMTP...");
  const result = await patchAuth(token, env);
  console.log("SUCCESS", JSON.stringify(result, null, 2));

  await browser.close().catch(() => {});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
