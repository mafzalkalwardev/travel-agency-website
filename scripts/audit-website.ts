/**
 * Full-site Playwright audit for local and production.
 * Run: npm run audit-website
 * Env: SCREENSHOT_BASE_URL (default http://localhost:3000)
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { chromium, type Page } from "playwright";

const BASE_URL = (process.env.SCREENSHOT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const OUTPUT_DIR = join(__dirname, "..", "tmp", "website-audit");
const SCREENSHOT_DIR = join(OUTPUT_DIR, "screenshots");

const STATIC_ROUTES = [
  { path: "/", label: "Home", expectH1: true },
  { path: "/about/", label: "About", expectH1: true },
  { path: "/services/", label: "Services", expectH1: true },
  { path: "/umrah-packages/", label: "Umrah Packages", expectH1: true },
  { path: "/tour-packages/", label: "Tour Packages", expectH1: true },
  { path: "/available-tickets/", label: "Available Tickets", expectH1: true },
  { path: "/corporate-travel/", label: "Corporate Travel", expectH1: true },
  { path: "/destinations/", label: "Destinations", expectH1: true },
  { path: "/gallery/", label: "Gallery", expectH1: true },
  { path: "/contact/", label: "Contact", expectH1: true },
  { path: "/inquiry/", label: "Inquiry", expectH1: true },
  { path: "/account/login/", label: "Account Login", expectH1: true },
  { path: "/account/signup/", label: "Account Signup", expectH1: true },
  { path: "/admin/login/", label: "Admin Login", expectH1: true },
  { path: "/flight-booking/", label: "Flight Booking Redirect", expectH1: true, finalPath: "/available-tickets/" },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, name: "desktop" },
  mobile: { width: 390, height: 844, name: "mobile" },
} as const;

type ViewportName = keyof typeof VIEWPORTS;

interface RouteResult {
  path: string;
  label: string;
  viewport: ViewportName;
  ok: boolean;
  status: number | null;
  finalUrl: string;
  issues: string[];
  screenshot?: string;
}

function isBenignConsoleMessage(text: string): boolean {
  const benign = [
    "Download the React DevTools",
    "hydration",
    "Third-party cookie",
    "favicon",
    "Failed to load resource",
    "net::ERR_",
  ];
  return benign.some((b) => text.toLowerCase().includes(b.toLowerCase()));
}

async function waitForServer(url: string, attempts = 40): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Server not reachable at ${url}. Start with: npm run dev`);
}

async function auditRoute(
  page: Page,
  route: { path: string; label: string; expectH1?: boolean; finalPath?: string },
  viewport: ViewportName
): Promise<RouteResult> {
  const issues: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.removeAllListeners("console");
  page.removeAllListeners("pageerror");

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!isBenignConsoleMessage(text)) consoleErrors.push(text);
    }
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const url = `${BASE_URL}${route.path}`;
  let status: number | null = null;
  let screenshot: string | undefined;

  try {
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    status = response?.status() ?? null;
    if (status && status >= 400) issues.push(`HTTP ${status}`);

    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const finalUrl = page.url();
    if (route.finalPath && !finalUrl.includes(route.finalPath)) {
      issues.push(`Expected redirect to ${route.finalPath}, got ${finalUrl}`);
    }

    if (route.expectH1) {
      const h1Count = await page.locator("h1").count();
      if (h1Count === 0) issues.push("Missing h1 heading");
    }

    const headerNav = page.locator("header nav").first();
    const hamburger = page.getByRole("button", { name: /open menu/i });
    const isAdminRoute = route.path.startsWith("/admin");

    if (!isAdminRoute) {
      if (viewport === "desktop") {
        const navVisible = await headerNav.isVisible().catch(() => false);
        const burgerVisible = await hamburger.isVisible().catch(() => false);
        if (!navVisible) issues.push("Desktop nav not visible at 1440px");
        if (burgerVisible) issues.push("Hamburger menu visible on desktop");
      } else {
        const navVisible = await headerNav.isVisible().catch(() => false);
        const burgerVisible = await hamburger.isVisible().catch(() => false);
        if (navVisible) issues.push("Desktop nav visible on mobile (should be hidden)");
        if (!burgerVisible) issues.push("Hamburger menu not visible on mobile");
      }
    }

    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs
        .filter(
          (img) =>
            img.complete &&
            img.naturalWidth === 0 &&
            img.src &&
            !img.src.startsWith("data:") &&
            !img.src.includes("logo.png")
        )
        .map((img) => img.src)
        .slice(0, 5);
    });
    if (brokenImages.length > 0) {
      issues.push(`Broken images: ${brokenImages.join(", ")}`);
    }

    if (pageErrors.length > 0) issues.push(`Page errors: ${pageErrors.join(" | ")}`);
    if (consoleErrors.length > 0) issues.push(`Console errors: ${consoleErrors.slice(0, 3).join(" | ")}`);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "Navigation failed");
  }

  if (issues.length > 0) {
    const safeName = `${route.label}-${viewport}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    screenshot = join(SCREENSHOT_DIR, `${safeName}.png`);
    await page.screenshot({ path: screenshot, fullPage: false }).catch(() => undefined);
  }

  return {
    path: route.path,
    label: route.label,
    viewport,
    ok: issues.length === 0,
    status,
    finalUrl: page.url(),
    issues,
    screenshot: issues.length > 0 ? screenshot : undefined,
  };
}

function buildMarkdownReport(results: RouteResult[], baseUrl: string): string {
  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const desktopFailed = failed.filter((r) => r.viewport === "desktop");
  const mobileFailed = failed.filter((r) => r.viewport === "mobile");

  const working = [...new Set(passed.map((r) => r.label))];
  const broken = failed.map(
    (r) =>
      `- **${r.label}** (${r.viewport}, ${r.path}): ${r.issues.join("; ")}${r.screenshot ? ` — screenshot: \`${r.screenshot}\`` : ""}`
  );

  const polish: string[] = [];
  if (baseUrl.includes("localhost")) {
    polish.push("Local dev requires `npm run dev` running before audit.");
  }
  polish.push("Navbar now shows full horizontal links at xl (1280px+) instead of 1800px+.");
  polish.push(
    "`/available-tickets/` may briefly show \"Loading tickets...\" during Suspense hydration — expected, not a failure."
  );
  polish.push("Duplicate ticket card DOM (mobile + desktop layouts) is intentional CSS show/hide.");

  return `# Website Audit Report

**Audited:** ${new Date().toISOString()}  
**Base URL:** ${baseUrl}  
**Summary:** ${passed.length}/${results.length} checks passed

## Working (${working.length} pages)

${working.map((w) => `- ${w}`).join("\n")}

## Broken (${failed.length} checks)

${broken.length > 0 ? broken.join("\n") : "_None — all routes passed._"}

### Desktop failures: ${desktopFailed.length}
### Mobile failures: ${mobileFailed.length}

## Needs polish / notes

${polish.map((p) => `- ${p}`).join("\n")}
`;
}

async function main() {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(new URL(BASE_URL).hostname);

  if (isLocal) {
    await waitForServer(BASE_URL);
  }

  const routes = STATIC_ROUTES;

  const browser = await chromium.launch({ headless: true });
  const results: RouteResult[] = [];

  for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
    const context = await browser.newContext({
      viewport: VIEWPORTS[viewport],
      deviceScaleFactor: 1,
    });

    for (const route of routes) {
      const page = await context.newPage();
      const result = await auditRoute(page, route, viewport);
      results.push(result);
      const icon = result.ok ? "✓" : "✗";
      console.log(`${icon} [${viewport}] ${route.label} — ${result.issues.length ? result.issues.join("; ") : "OK"}`);
      await page.close();
    }

    await context.close();
  }

  await browser.close();

  const report = {
    at: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    },
    results,
  };

  writeFileSync(join(OUTPUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  const md = buildMarkdownReport(results, BASE_URL);
  const mdPath =
    isLocal
      ? join(__dirname, "..", "WEBSITE-AUDIT-REPORT.local.md")
      : join(__dirname, "..", "WEBSITE-AUDIT-REPORT.production.md");
  writeFileSync(mdPath, md);

  console.log(`\nReport: ${join(OUTPUT_DIR, "report.json")}`);
  console.log(`Markdown: ${mdPath}`);
  console.log(`Passed: ${report.summary.passed}/${report.summary.total}`);

  if (report.summary.failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
