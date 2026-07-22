/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Apply Supabase Auth URL + Resend SMTP using the user's real Chrome profile
 * (School / Alqibla) via CDP — not a blank Playwright profile.
 *
 * Run: node scripts/apply-supabase-auth-browser.js
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const PROJECT_REF = "gjatvtyzncpusgkpzldz";
const CDP_PORT = 9222;

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

function resolveChromePath() {
  const candidates = [
    path.join(process.env.PROGRAMFILES || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
  ];
  for (const p of candidates) if (p && fs.existsSync(p)) return p;
  throw new Error("chrome.exe not found");
}

function resolveProfileDirectory() {
  // Prefer Alqibla (salesalqibla) then School (243472@students.au.edu.pk)
  const base = path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "User Data");
  const state = JSON.parse(fs.readFileSync(path.join(base, "Local State"), "utf8"));
  const info = state.profile?.info_cache || {};
  const preferred = [];
  for (const [dir, meta] of Object.entries(info)) {
    const name = String(meta.name || "");
    const gaia = String(meta.user_name || meta.gaia_name || "");
    if (gaia.toLowerCase() === "salesalqibla@gmail.com" || name === "Alqibla") preferred.unshift(dir);
    else if (gaia.toLowerCase() === "243472@students.au.edu.pk" || /school/i.test(name)) preferred.push(dir);
  }
  const chosen = preferred[0] || "Profile 3";
  console.log("Using Chrome profile directory:", chosen);
  return { userDataDir: base, profileDirectory: chosen };
}

async function waitForCdp(port, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function connectToUserChrome() {
  // If CDP already open, reuse it
  if (await waitForCdp(CDP_PORT, 1500)) {
    console.log("Connecting to existing Chrome CDP on", CDP_PORT);
    return chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  }

  const chromePath = resolveChromePath();
  const { userDataDir, profileDirectory } = resolveProfileDirectory();

  console.log("Restarting Chrome with remote debugging on your profile...");
  console.log("(Needed so automation can use the already-logged-in School/Alqibla session.)");

  // Chrome singleton ignores debug flags if an instance is already running on same user-data-dir.
  spawn("taskkill", ["/IM", "chrome.exe", "/F"], { stdio: "ignore", windowsHide: true });
  await new Promise((r) => setTimeout(r, 2500));

  spawn(
    chromePath,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      `--profile-directory=${profileDirectory}`,
      "--no-first-run",
      "--no-default-browser-check",
      `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration`,
    ],
    { detached: true, stdio: "ignore", windowsHide: false }
  ).unref();

  const ok = await waitForCdp(CDP_PORT, 45000);
  if (!ok) throw new Error("Chrome CDP did not start on port " + CDP_PORT);
  return chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
}

async function fillFirstVisible(page, selectors, value) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if ((await loc.count()) === 0) continue;
    if (!(await loc.isVisible().catch(() => false))) continue;
    await loc.click({ clickCount: 3 }).catch(() => {});
    await loc.fill(String(value));
    await loc.blur().catch(() => {});
    return true;
  }
  return false;
}

async function ensureLoggedIn(page, email, password) {
  await page.goto(
    `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration`,
    { waitUntil: "domcontentloaded", timeout: 120000 }
  );
  await page.waitForTimeout(3000);

  if (page.url().includes(`/project/${PROJECT_REF}/`)) {
    console.log("Already logged into Supabase in this Chrome profile");
    return;
  }

  // Email/password only — do NOT open a separate GitHub Google window
  if (await page.locator("#email, input[type='email']").count()) {
    console.log("Signing in with email/password...");
    await page.locator("#email, input[type='email']").first().fill(email);
    await page.locator("#password, input[type='password']").first().fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForTimeout(5000);
  }

  // If still on sign-in, use GitHub SSO in THIS same profile (already logged in)
  if (!page.url().includes(`/project/${PROJECT_REF}/`) && page.url().includes("sign-in")) {
    const gh = page.getByRole("button", { name: /continue with github/i });
    if (await gh.count()) {
      console.log("Using Continue with GitHub in the same Chrome profile...");
      await gh.click();
      await page.waitForTimeout(4000);
      // Authorize if asked (same profile — should not ask Google again)
      for (let i = 0; i < 15; i++) {
        if (page.url().includes(`/project/${PROJECT_REF}/`)) break;
        if (page.url().includes("github.com")) {
          const authBtn = page.getByRole("button", { name: /authorize|continue/i }).first();
          if ((await authBtn.count()) && (await authBtn.isVisible().catch(() => false))) {
            await authBtn.click().catch(() => {});
          }
        }
        await page.waitForTimeout(2000);
      }
    }
  }

  if (!page.url().includes(`/project/${PROJECT_REF}/`)) {
    await page.goto(
      `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration`,
      { waitUntil: "domcontentloaded", timeout: 120000 }
    );
    await page.waitForTimeout(3000);
  }

  if (!page.url().includes(`/project/${PROJECT_REF}/`)) {
    throw new Error("Supabase login failed. Current URL: " + page.url());
  }
  console.log("Logged in OK");
}

async function addRedirectUrls(page, urls) {
  const textarea = page.locator("textarea").first();
  if ((await textarea.count()) && (await textarea.isVisible().catch(() => false))) {
    const name = await textarea.getAttribute("name");
    if (name !== "g-recaptcha-response" && name !== "h-captcha-response") {
      await textarea.fill(urls.join("\n"));
      return "textarea";
    }
  }
  for (const url of urls) {
    const addBtn = page.getByRole("button", { name: /add url|^add$/i }).first();
    if ((await addBtn.count()) && !(await addBtn.isDisabled().catch(() => true))) {
      await addBtn.click().catch(() => {});
      await page.waitForTimeout(350);
    }
    const input = page
      .locator('input[placeholder*="http" i], input[placeholder*="URL" i], input[type="url"]')
      .last();
    if ((await input.count()) && (await input.isVisible().catch(() => false))) {
      await input.fill(url);
      await input.press("Enter").catch(() => {});
      await page.waitForTimeout(250);
    }
  }
  return "chips";
}

async function clickSaveWhenEnabled(page, label) {
  const save = page.getByRole("button", { name: /save/i }).first();
  if (!(await save.count())) {
    console.log("No Save button on", label);
    return false;
  }
  for (let i = 0; i < 30; i++) {
    if (!(await save.isDisabled().catch(() => true))) {
      await save.click();
      await page.waitForTimeout(2500);
      console.log("Saved", label);
      return true;
    }
    await page.waitForTimeout(400);
  }
  console.log("Save still disabled on", label);
  return false;
}

async function main() {
  const env = loadEnv();
  const email = env.SUPABASE_DASHBOARD_EMAIL;
  const password = env.SUPABASE_DASHBOARD_PASSWORD;
  const siteUrl = (env.NEXT_PUBLIC_SITE_URL || "https://flywithalqibla.com").replace(/\/$/, "");
  const fromEmail = env.AUTH_FROM_EMAIL || env.BOOKING_FROM_EMAIL || "noreply@flywithalqibla.com";
  const resendKey = env.RESEND_API_KEY;
  if (!email || !password) throw new Error("Missing SUPABASE_DASHBOARD_EMAIL/PASSWORD");
  if (!resendKey) throw new Error("Missing RESEND_API_KEY");

  const redirectUrls = [
    `${siteUrl}/**`,
    `${siteUrl}/account/**`,
    `${siteUrl}/account/login`,
    `${siteUrl}/account/login/`,
    "http://localhost:3000/**",
    "http://localhost:3000/account/**",
  ];

  const shotDir = path.join(__dirname, "..", ".tmp-supabase-auth");
  fs.mkdirSync(shotDir, { recursive: true });

  const browser = await connectToUserChrome();
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());

  try {
    await ensureLoggedIn(page, email, password);

    await page.goto(
      `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration`,
      { waitUntil: "domcontentloaded", timeout: 120000 }
    );
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(shotDir, "01-url.png"), fullPage: true }).catch(() => {});

    let siteFilled = await fillFirstVisible(
      page,
      ['input[name="siteUrl"]', 'input[name="site_url"]', 'input[id*="site" i]'],
      siteUrl
    );
    if (!siteFilled) {
      const byLabel = page.getByLabel(/site url/i);
      if (await byLabel.count()) {
        await byLabel.fill(siteUrl);
        siteFilled = true;
      }
    }
    console.log("Site URL filled:", siteFilled);

    console.log("Redirect URLs via:", await addRedirectUrls(page, redirectUrls));
    await page.screenshot({ path: path.join(shotDir, "02-url-filled.png"), fullPage: true }).catch(() => {});
    await clickSaveWhenEnabled(page, "URL configuration");

    await page.goto(`https://supabase.com/dashboard/project/${PROJECT_REF}/auth/smtp`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(4000);

    const enableSwitch = page.getByRole("switch").first();
    if (await enableSwitch.count()) {
      const checked = await enableSwitch.getAttribute("aria-checked");
      if (checked !== "true") {
        await enableSwitch.click();
        await page.waitForTimeout(1500);
      }
    }

    for (const [label, value] of [
      [/host/i, "smtp.resend.com"],
      [/port/i, "465"],
      [/username|^user$/i, "resend"],
      [/password/i, resendKey],
      [/sender email|admin email/i, fromEmail],
      [/sender name/i, "Al Qibla Air Services"],
    ]) {
      const loc = page.getByLabel(label).first();
      if (await loc.count()) await loc.fill(String(value)).catch(() => {});
    }

    await fillFirstVisible(page, ['input[name="host"]', 'input[name="smtp_host"]'], "smtp.resend.com");
    await fillFirstVisible(page, ['input[name="port"]', 'input[name="smtp_port"]'], "465");
    await fillFirstVisible(page, ['input[name="user"]', 'input[name="username"]', 'input[name="smtp_user"]'], "resend");
    await fillFirstVisible(page, ['input[type="password"]', 'input[name="pass"]', 'input[name="smtp_pass"]'], resendKey);
    await fillFirstVisible(page, ['input[name="admin_email"]', 'input[name="smtp_admin_email"]'], fromEmail);
    await fillFirstVisible(page, ['input[name="sender_name"]', 'input[name="smtp_sender_name"]'], "Al Qibla Air Services");

    await page.screenshot({ path: path.join(shotDir, "04-smtp-filled.png"), fullPage: true }).catch(() => {});
    await clickSaveWhenEnabled(page, "SMTP settings");

    console.log("DONE — Auth URL + SMTP applied via your Chrome profile");
    await page.waitForTimeout(3000);
  } finally {
    // Do not close the user's Chrome — only disconnect Playwright
    await browser.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
