/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Configure Supabase Auth for production (site URL, redirects, Resend SMTP).
 *
 * Requires SUPABASE_ACCESS_TOKEN from:
 *   https://supabase.com/dashboard/account/tokens
 *
 * Run:
 *   set SUPABASE_ACCESS_TOKEN=sbp_...
 *   node scripts/configure-supabase-auth-live.js
 */
const fs = require("fs");
const path = require("path");

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

/** Read token saved by `supabase login` (CLI credentials store). */
function readCliAccessToken() {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const candidates = [
    path.join(home, ".supabase", "access-token"),
    path.join(process.env.APPDATA || "", "supabase", "access-token"),
    path.join(home, "AppData", "Roaming", "supabase", "access-token"),
    path.join(home, "AppData", "Local", "supabase", "access-token"),
  ];
  for (const file of candidates) {
    if (!file || !fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8").trim();
    if (!raw) continue;
    try {
      const json = JSON.parse(raw);
      if (typeof json.access_token === "string" && json.access_token) return json.access_token;
      if (typeof json.token === "string" && json.token) return json.token;
    } catch {
      if (raw.startsWith("sbp_") || raw.startsWith("sb_")) return raw;
    }
  }
  return "";
}

async function main() {
  const env = loadEnv();
  const token = env.SUPABASE_ACCESS_TOKEN || readCliAccessToken();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
  const resendKey = env.RESEND_API_KEY;
  const siteUrl = (env.NEXT_PUBLIC_SITE_URL || "https://www.flywithalqibla.com").replace(/\/$/, "");
  const fromEmail = env.AUTH_FROM_EMAIL || env.BOOKING_FROM_EMAIL || "noreply@flywithalqibla.com";

  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectRef = env.SUPABASE_PROJECT_REF || (refMatch ? refMatch[1] : null);

  if (!token) {
    console.error(
      "Missing SUPABASE_ACCESS_TOKEN.\n" +
        "1. Open https://supabase.com/dashboard/account/tokens\n" +
        "2. Generate a token\n" +
        "3. Add to .env: SUPABASE_ACCESS_TOKEN=sbp_...\n" +
        "4. Re-run: node scripts/configure-supabase-auth-live.js"
    );
    process.exit(1);
  }
  if (!projectRef) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / project ref");
    process.exit(1);
  }
  if (!resendKey) {
    console.error("Missing RESEND_API_KEY (needed for Custom SMTP)");
    process.exit(1);
  }

  // Prefer www; also allow apex so old email links still succeed before redirect.
  const hosts = Array.from(
    new Set([
      siteUrl,
      siteUrl.replace("://www.", "://"),
      "https://www.flywithalqibla.com",
      "https://flywithalqibla.com",
    ])
  );

  const uriAllowList = [
    ...hosts.flatMap((h) => [
      h,
      `${h}/**`,
      `${h}/account/login`,
      `${h}/account/login/`,
      `${h}/account/reset-password`,
      `${h}/account/reset-password/`,
      `${h}/account/**`,
    ]),
    "http://localhost:3000",
    "http://localhost:3000/**",
    "http://localhost:3000/account/login",
    "http://localhost:3000/account/login/",
    "http://localhost:3000/account/**",
  ].join(",");

  const payload = {
    site_url: siteUrl.includes("www.") ? siteUrl : "https://www.flywithalqibla.com",
    uri_allow_list: uriAllowList,
    external_email_enabled: true,
    mailer_secure_email_change_enabled: true,
    mailer_autoconfirm: false,
    smtp_admin_email: fromEmail,
    smtp_host: "smtp.resend.com",
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: resendKey,
    smtp_sender_name: "Al Qibla Air Services",
  };

  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  console.log(`PATCH ${url}`);
  console.log(`site_url=${siteUrl}`);
  console.log(`smtp_admin_email=${fromEmail}`);
  console.log(`smtp_host=smtp.resend.com:465`);

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Failed (${res.status}):`, text);
    process.exit(1);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  console.log("Auth config updated.");
  if (json) {
    console.log(
      JSON.stringify(
        {
          site_url: json.site_url,
          uri_allow_list: json.uri_allow_list,
          external_email_enabled: json.external_email_enabled,
          smtp_host: json.smtp_host,
          smtp_port: json.smtp_port,
          smtp_user: json.smtp_user,
          smtp_admin_email: json.smtp_admin_email,
          smtp_sender_name: json.smtp_sender_name,
          smtp_pass_set: Boolean(json.smtp_pass),
        },
        null,
        2
      )
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
