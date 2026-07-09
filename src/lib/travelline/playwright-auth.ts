import { getTravelLineConfig } from "./env";
import type { TravelLineSession } from "./types";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Playwright runtime unavailable: ${error.message}`
        : "Playwright runtime unavailable"
    );
  }
}

export async function loginTravelLineViaPlaywright(): Promise<TravelLineSession | null> {
  const { baseUrl, adminUrl, username, password } = getTravelLineConfig();
  if (!username || !password) return null;

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    for (const url of [`${baseUrl}/login`, `${adminUrl}/signin`, `${adminUrl}/login`]) {
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

        const phoneSelectors = [
          'input[type="tel"]',
          'input[name*="phone" i]',
          'input[name*="user" i]',
          'input[name*="email" i]',
          'input[type="text"]',
        ];

        let filled = false;
        for (const selector of phoneSelectors) {
          const field = page.locator(selector).first();
          if ((await field.count()) > 0) {
            await field.fill(username);
            filled = true;
            break;
          }
        }

        const passwordField = page.locator('input[type="password"]').first();
        if (!filled || (await passwordField.count()) === 0) continue;

        await passwordField.fill(password);
        const submit = page
          .locator(
            'button[type="submit"], input[type="submit"], button:has-text("Sign"), button:has-text("Login")'
          )
          .first();
        if ((await submit.count()) === 0) continue;

        await Promise.all([
          page.waitForURL((current) => !current.toString().includes("/login"), { timeout: 30000 }).catch(() => null),
          submit.click(),
        ]);
        await page.waitForTimeout(2500);

        const cookies = await context.cookies();
        const sessionCookies = cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
        }));

        if (sessionCookies.some((cookie) => cookie.name.includes("session-token"))) {
          return {
            cookies: sessionCookies,
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          };
        }
      } catch {
        /* try next login URL */
      }
    }

    return null;
  } finally {
    await browser.close();
  }
}
