type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Returns remaining wait ms when blocked, otherwise null. */
export function consumeLoginAttempt(key: string): { blocked: boolean; retryAfterMs: number } {
  const now = Date.now();
  prune(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { blocked: false, retryAfterMs: 0 };
  }

  existing.count += 1;
  if (existing.count > MAX_ATTEMPTS) {
    return { blocked: true, retryAfterMs: Math.max(0, existing.resetAt - now) };
  }

  return { blocked: false, retryAfterMs: 0 };
}

export function clearLoginAttempts(key: string) {
  buckets.delete(key);
}
