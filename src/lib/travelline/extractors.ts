import type { TravelLineUmrahApiItem } from "./mappers";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function looksLikeUmrahItem(value: unknown): value is TravelLineUmrahApiItem {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.price === "number"
  );
}

function parseCandidate(payload: unknown): TravelLineUmrahApiItem[] {
  if (Array.isArray(payload)) {
    return payload.filter(looksLikeUmrahItem);
  }

  if (isObject(payload)) {
    for (const key of ["items", "data", "packages", "results"]) {
      const nested = payload[key];
      if (Array.isArray(nested)) {
        const items = nested.filter(looksLikeUmrahItem);
        if (items.length) return items;
      }
    }
  }

  return [];
}

export function extractUmrahItemsFromJsonText(text: string): TravelLineUmrahApiItem[] {
  try {
    return parseCandidate(JSON.parse(text));
  } catch {
    return [];
  }
}

export function extractUmrahItemsFromHtml(html: string): TravelLineUmrahApiItem[] {
  const candidates = new Set<string>();

  for (const match of html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1]) candidates.add(match[1]);
  }

  for (const match of html.matchAll(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1]) candidates.add(match[1]);
  }

  for (const blob of candidates) {
    const items = extractUmrahItemsFromJsonText(blob);
    if (items.length) return items;
  }

  return [];
}
