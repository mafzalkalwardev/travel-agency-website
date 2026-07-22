/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Production go-live smoke checks.
 * Run: node scripts/smoke-live.js
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function checkPage(url, mustInclude) {
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  assert(res.ok, `${url} => ${res.status}`);
  if (mustInclude) {
    for (const s of mustInclude) {
      assert(text.includes(s), `${url} missing "${s}"`);
    }
  }
  return { url, status: res.status, bytes: text.length };
}

async function main() {
  const env = loadEnv();
  const site = "https://flywithalqibla.com";
  const results = [];

  console.log("== Pages ==");
  results.push(await checkPage(`${site}/`));
  results.push(await checkPage(`${site}/available-tickets/`));
  results.push(await checkPage(`${site}/account/signup/`));
  results.push(await checkPage(`${site}/account/login/`));
  console.log(results.map((r) => `${r.status} ${r.url} (${r.bytes}b)`).join("\n"));

  console.log("\n== Supabase Auth config ==");
  assert(env.SUPABASE_ACCESS_TOKEN, "SUPABASE_ACCESS_TOKEN missing");
  const authRes = await fetch("https://api.supabase.com/v1/projects/gjatvtyzncpusgkpzldz/config/auth", {
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
  });
  const auth = await authRes.json();
  assert(authRes.ok, `auth config ${authRes.status}`);
  assert(auth.site_url === "https://flywithalqibla.com", `site_url=${auth.site_url}`);
  assert(String(auth.uri_allow_list || "").includes("https://flywithalqibla.com"), "redirect allow list missing live domain");
  assert(auth.smtp_host === "smtp.resend.com", `smtp_host=${auth.smtp_host}`);
  assert(String(auth.smtp_admin_email || "").includes("flywithalqibla.com"), `smtp_admin_email=${auth.smtp_admin_email}`);
  console.log("site_url OK, redirects OK, smtp OK");

  console.log("\n== Resend send probe ==");
  assert(env.RESEND_API_KEY, "RESEND_API_KEY missing");
  const to = env.BOOKING_ADMIN_EMAIL || env.ADMIN_EMAIL || "salesalqibla@gmail.com";
  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Al Qibla Air Services <noreply@flywithalqibla.com>",
      to: [to],
      subject: `Go-live smoke ${new Date().toISOString()}`,
      html: "<p>Production smoke test from flywithalqibla.com — live email path OK.</p>",
    }),
  });
  const sendBody = await sendRes.text();
  assert(sendRes.ok, `resend ${sendRes.status} ${sendBody}`);
  console.log("Resend OK", sendBody);

  console.log("\n== Signup verification link generation ==");
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const testEmail = `golive.smoke.${Date.now()}@flywithalqibla.com`;
  // Use generateLink only (does not require mailbox on that address to exist for link creation)
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email: testEmail,
    password: `SmokeTest_${Date.now()}!aA`,
    options: {
      redirectTo: "https://flywithalqibla.com/account/login/",
    },
  });
  assert(!error, `generateLink error: ${error?.message}`);
  const actionLink = data?.properties?.action_link || "";
  assert(actionLink.startsWith("http"), "missing action_link");
  assert(
    actionLink.includes("redirect_to=") && decodeURIComponent(actionLink).includes("flywithalqibla.com"),
    `action_link redirect not live domain: ${actionLink.slice(0, 180)}`
  );
  console.log("generateLink redirect OK");

  // cleanup test user if created
  if (data?.user?.id) {
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log("cleaned test user");
  }

  console.log("\nALL SMOKE CHECKS PASSED");
}

main().catch((err) => {
  console.error("SMOKE FAILED:", err.message || err);
  process.exit(1);
});
