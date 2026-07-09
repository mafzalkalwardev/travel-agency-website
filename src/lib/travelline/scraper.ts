import { getTravelLineConfig } from "./env";
import { extractUmrahItemsFromHtml, extractUmrahItemsFromJsonText } from "./extractors";
import type { TravelLineUmrahApiItem } from "./mappers";

const SCRAPER_PATHS = ["/", "/explore", "/login"] as const;

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

async function tryPortalLogin(page: { goto: Function; locator: Function; waitForTimeout: Function }) {
  const { baseUrl, adminUrl, username, password } = getTravelLineConfig();
  if (!username || !password) return;

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
        .locator('button[type="submit"], input[type="submit"], button:has-text("Sign"), button:has-text("Login")')
        .first();
      if ((await submit.count()) === 0) continue;

      await Promise.all([
        page.waitForTimeout(3000),
        submit.click().catch(() => null),
      ]);
      return;
    } catch {
      /* try next URL */
    }
  }
}

export async function scrapeTravelLineUmrahItems(): Promise<TravelLineUmrahApiItem[]> {
  const { chromium } = await loadPlaywright();
  const { baseUrl } = getTravelLineConfig();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    let intercepted: TravelLineUmrahApiItem[] = [];

    page.on("response", async (response: { url: Function; text: Function; headers: Function }) => {
      const url = String(response.url());
      if (!url.includes("/api/umrah-packages")) return;
      try {
        const text = await response.text();
        const items = extractUmrahItemsFromJsonText(text);
        if (items.length) intercepted = items;
      } catch {
        /* ignore malformed payload */
      }
    });

    await tryPortalLogin(page);

    for (const path of SCRAPER_PATHS) {
      try {
        await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle", timeout: 60000 });
        await page.waitForTimeout(2500);
        if (intercepted.length) return intercepted;

        const html = await page.content();
        const htmlItems = extractUmrahItemsFromHtml(html);
        if (htmlItems.length) return htmlItems;
      } catch {
        /* try next path */
      }
    }

    await page.goto(`${baseUrl}/api/umrah-packages`, { waitUntil: "networkidle", timeout: 60000 });
    const text = await page.locator("body").innerText();
    const apiItems = extractUmrahItemsFromJsonText(text);
    if (apiItems.length) return apiItems;

    throw new Error("Travel Line scraper could not extract package inventory");
  } finally {
    await browser.close();
  }
}
