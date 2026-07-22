/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Apply Auth URL + Resend SMTP in Supabase Dashboard via headed Edge.
 * Run: node scripts/apply-supabase-auth-browser.js
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

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

async function fillFirstVisible(page, selectors, value) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if ((await loc.count()) === 0) continue;
    if (!(await loc.isVisible().catch(() => false))) continue;
    await loc.click({ clickCount: 3 }).catch(() => {});
    await loc.fill("");
    await loc.fill(value);
    await loc.blur().catch(() => {});
    return true;
  }
  return false;
}

async function addRedirectUrls(page, urls) {
  // Newer UI: "Add URL" / chip input. Older: textarea.
  const textarea = page.locator("textarea").first();
  if ((await textarea.count()) && (await textarea.isVisible().catch(() => false))) {
    await textarea.fill(urls.join("\n"));
    return "textarea";
  }

  for (const url of urls) {
    // Try add button each time
    const addBtn = page.getByRole("button", { name: /add url|add/i }).first();
    if (await addBtn.count()) {
      const disabled = await addBtn.isDisabled().catch(() => false);
      if (!disabled) await addBtn.click().catch(() => {});
      await page.waitForTimeout(400);
    }

    const input = page
      .locator(
        'input[placeholder*="http" i], input[placeholder*="URL" i], input[placeholder*="redirect" i], input[type="url"]'
      )
      .last();
    if ((await input.count()) && (await input.isVisible().catch(() => false))) {
      await input.fill(url);
      await input.press("Enter").catch(() => {});
      await page.waitForTimeout(300);
      continue;
    }

    // Fallback: any empty text input near Redirect heading
    const near = page.locator("text=/Redirect URLs/i").locator("..").locator("input").last();
    if ((await near.count()) && (await near.isVisible().catch(() => false))) {
      await near.fill(url);
      await near.press("Enter").catch(() => {});
    }
  }
  return "chips";
}

async function clickSaveWhenEnabled(page, label) {
  const save = page.getByRole("button", { name: /save/i }).first();
  if (!(await save.count())) {
    console.log(`No Save button on ${label}`);
    return false;
  }
  for (let i = 0; i < 20; i++) {
    if (!(await save.isDisabled().catch(() => true))) {
      await save.click();
      await page.waitForTimeout(2000);
      console.log(`Saved ${label}`);
      return true;
    }
    await page.waitForTimeout(500);
  }
  console.log(`Save still disabled on ${label}`);
  return false;
}

async function main() {
  const env = loadEnv();
  const projectRef = "gjatvtyzncpusgkpzldz";
  const siteUrl = (env.NEXT_PUBLIC_SITE_URL || "https://flywithalqibla.com").replace(/\/$/, "");
  const fromEmail = env.AUTH_FROM_EMAIL || env.BOOKING_FROM_EMAIL || "noreply@flywithalqibla.com";
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) throw new Error("RESEND_API_KEY missing");

  const redirectUrls = [
    `${siteUrl}/**`,
    `${siteUrl}/account/**`,
    `${siteUrl}/account/login`,
    `${siteUrl}/account/login/`,
    "http://localhost:3000/**",
    "http://localhost:3000/account/**",
  ];

  const profileDir = path.join(__dirname, "..", ".tmp-edge-supabase-profile");
  fs.mkdirSync(profileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "msedge",
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = context.pages()[0] || (await context.newPage());
  const shotDir = path.join(__dirname, "..", ".tmp-supabase-auth");
  fs.mkdirSync(shotDir, { recursive: true });

  console.log("Opening Auth URL configuration...");
  await page.goto(
    `https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`,
    { waitUntil: "domcontentloaded", timeout: 120000 }
  );
  await page.waitForTimeout(4000);

  const onProject = () => page.url().includes(`/project/${projectRef}/`);
  if (!onProject()) {
    console.log("Sign in to Supabase in the Edge window (up to 10 minutes)...");
    const deadline = Date.now() + 10 * 60 * 1000;
    while (Date.now() < deadline && !onProject()) {
      await page.waitForTimeout(3000);
    }
    if (!onProject()) throw new Error("Timed out waiting for Supabase login");
    await page.goto(
      `https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`,
      { waitUntil: "domcontentloaded", timeout: 120000 }
    );
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: path.join(shotDir, "01-url-config.png"), fullPage: true });

  const siteFilled = await fillFirstVisible(
    page,
    [
      'input[name="siteUrl"]',
      'input[name="site_url"]',
      'input[id*="site" i]',
      'label:text-is("Site URL") >> xpath=following::input[1]',
      'text=Site URL >> xpath=ancestor::div[1]//input',
      'text=Site URL >> xpath=ancestor::div[2]//input',
      'text=Site URL >> xpath=ancestor::div[3]//input',
    ],
    siteUrl
  );
  // Also try getting by label
  if (!siteFilled) {
    const byLabel = page.getByLabel(/site url/i);
    if (await byLabel.count()) {
      await byLabel.fill(siteUrl);
      console.log("Site URL filled via label");
    } else {
      console.log("Site URL filled:", false);
    }
  } else {
    console.log("Site URL filled:", true);
  }

  const mode = await addRedirectUrls(page, redirectUrls);
  console.log("Redirect URLs via:", mode);
  await page.screenshot({ path: path.join(shotDir, "02-url-filled.png"), fullPage: true });
  await clickSaveWhenEnabled(page, "URL configuration");

  console.log("Opening SMTP settings...");
  await page.goto(`https://supabase.com/dashboard/project/${projectRef}/auth/smtp`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(shotDir, "03-smtp.png"), fullPage: true });

  // Enable custom SMTP
  const enableSwitch = page.getByRole("switch").first();
  if (await enableSwitch.count()) {
    const checked = await enableSwitch.getAttribute("aria-checked");
    if (checked !== "true") {
      await enableSwitch.click();
      await page.waitForTimeout(1500);
    }
  } else {
    const enableBtn = page.getByText(/enable custom smtp/i).first();
    if (await enableBtn.count()) await enableBtn.click().catch(() => {});
  }

  await fillFirstVisible(page, ['input[name="host"]', 'input[name="smtp_host"]', 'label:has-text("Host") >> xpath=following::input[1]'], "smtp.resend.com");
  await fillFirstVisible(page, ['input[name="port"]', 'input[name="smtp_port"]', 'label:has-text("Port number") >> xpath=following::input[1]', 'label:has-text("Port") >> xpath=following::input[1]'], "465");
  await fillFirstVisible(page, ['input[name="user"]', 'input[name="username"]', 'input[name="smtp_user"]', 'label:has-text("Username") >> xpath=following::input[1]'], "resend");
  await fillFirstVisible(page, ['input[name="pass"]', 'input[name="password"]', 'input[name="smtp_pass"]', 'input[type="password"]'], resendKey);
  await fillFirstVisible(page, ['input[name="admin_email"]', 'input[name="smtp_admin_email"]', 'label:has-text("Sender email") >> xpath=following::input[1]'], fromEmail);
  await fillFirstVisible(page, ['input[name="sender_name"]', 'input[name="smtp_sender_name"]', 'label:has-text("Sender name") >> xpath=following::input[1]'], "Al Qibla Air Services");

  // Also try getByLabel
  for (const [label, value] of [
    [/host/i, "smtp.resend.com"],
    [/port/i, "465"],
    [/username|user/i, "resend"],
    [/password/i, resendKey],
    [/sender email|admin email/i, fromEmail],
    [/sender name/i, "Al Qibla Air Services"],
  ]) {
    const loc = page.getByLabel(label).first();
    if (await loc.count()) {
      await loc.fill(String(value)).catch(() => {});
    }
  }

  await page.screenshot({ path: path.join(shotDir, "04-smtp-filled.png"), fullPage: true });
  await clickSaveWhenEnabled(page, "SMTP settings");

  console.log("Done. Keeping browser open 15s...");
  await page.waitForTimeout(15000);
  await context.close();
  console.log("Screenshots in .tmp-supabase-auth/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
