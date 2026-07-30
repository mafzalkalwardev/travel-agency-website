import { getTravelLineConfig } from "./env";
import type { TravelLineBookingInput, TravelLineBookingResult } from "./types";
import { resolveTravelLinePackageId } from "./resolve-package-id";

interface CapturedRequest {
  method: string;
  url: string;
  status: number;
  body: string;
}

async function loadPlaywright() {
  return import("playwright");
}

export async function createBookingViaPlaywright(
  input: TravelLineBookingInput,
  packageSlug?: string
): Promise<TravelLineBookingResult> {
  const { baseUrl, username, password } = getTravelLineConfig();
  if (!username || !password) {
    return { success: false, error: "supplier credentials not configured" };
  }

  const packageId = resolveTravelLinePackageId(input.externalProductId);
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const captured: CapturedRequest[] = [];

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    page.on("response", async (response) => {
      const url = response.url();
      const method = response.request().method();
      if (method !== "POST" || !url.includes("travellinetour")) return;
      if (!/book|reserv|hold|order|cart|checkout/i.test(url)) return;
      try {
        captured.push({
          method,
          url,
          status: response.status(),
          body: (await response.text().catch(() => "")).slice(0, 2000),
        });
      } catch {
        /* ignore */
      }
    });

    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle", timeout: 60000 });
    const phoneField = page.locator('input[type="tel"], input[type="text"]').first();
    await phoneField.fill(username);
    await page.locator('input[type="password"]').first().fill(password);
    await Promise.all([
      page.waitForURL((url) => !url.toString().includes("/login"), { timeout: 30000 }).catch(() => null),
      page.locator('button[type="submit"]').first().click(),
    ]);
    await page.waitForTimeout(2000);

    const apiAttempts: Array<{ url: string; payload: Record<string, unknown> }> = [
      {
        url: `${baseUrl}/api/bookings`,
        payload: {
          packageId,
          passengers: input.passengers,
          passengerDetails: input.passengerDetails,
          price: input.quotedPrice,
          currency: input.currency,
        },
      },
      {
        url: `${baseUrl}/api/umrah-packages/${packageId}/book`,
        payload: {
          seats: input.passengers,
          passengerName: input.passengerDetails?.names,
          notes: input.passengerDetails?.notes,
        },
      },
      {
        url: `${baseUrl}/api/group-flights/book`,
        payload: {
          umrahPackageId: packageId,
          seats: input.passengers,
          totalPrice: input.quotedPrice,
          currency: input.currency,
        },
      },
    ];

    for (const attempt of apiAttempts) {
      const response = await context.request.post(attempt.url, {
        data: attempt.payload,
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });
      const text = await response.text();
      if (response.ok()) {
        let json: Record<string, unknown> = {};
        try {
          json = JSON.parse(text) as Record<string, unknown>;
        } catch {
          json = { raw: text };
        }
        const ref =
          json.bookingRef || json.reference || json.id || json.bookingId || `TL-${packageId}`;
        return { success: true, bookingRef: String(ref), raw: { url: attempt.url, json } };
      }
      if (response.status() !== 404 && response.status() !== 405) {
        return {
          success: false,
          error: text.slice(0, 300) || `Supplier returned ${response.status()}`,
          raw: { url: attempt.url, status: response.status(), body: text },
        };
      }
    }

    const slugPaths = [
      packageSlug ? `/umrah/${packageSlug}` : null,
      packageSlug ? `/explore/${packageSlug}` : null,
      packageSlug ? `/packages/${packageSlug}` : null,
      `/umrah/${packageId.toLowerCase()}`,
    ].filter(Boolean) as string[];

    for (const path of slugPaths) {
      try {
        await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(1500);

        const bookButton = page
          .locator(
            'button:has-text("Book"), button:has-text("Reserve"), button:has-text("Hold"), a:has-text("Book")'
          )
          .first();
        if ((await bookButton.count()) === 0) continue;

        await bookButton.click();
        await page.waitForTimeout(3000);

        const successCapture = captured.find((item) => item.status >= 200 && item.status < 300);
        if (successCapture) {
          let json: Record<string, unknown> = {};
          try {
            json = JSON.parse(successCapture.body) as Record<string, unknown>;
          } catch {
            json = { raw: successCapture.body };
          }
          const ref =
            json.bookingRef || json.reference || json.id || json.bookingId || `TL-${packageId}`;
          return {
            success: true,
            bookingRef: String(ref),
            raw: { capture: successCapture, json },
          };
        }
      } catch {
        /* try next path */
      }
    }

    return {
      success: false,
      error: "Could not place booking via supplier portal — no booking API responded",
      raw: { captured },
    };
  } finally {
    await browser.close();
  }
}
