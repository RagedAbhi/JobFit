// In-memory, per-server-instance rate limiting. This is a best-effort abuse
// deterrent, not a strict guarantee: Vercel serverless functions don't share
// memory across instances, so a burst of requests landing on different cold
// starts could each get their own fresh counter. For a low-traffic portfolio
// deployment this is a reasonable, zero-cost tradeoff -- upgrading to a
// shared store (e.g. Upstash Redis, which has its own free tier) would make
// this exact across instances if traffic ever justifies it.
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Bound memory growth from a Map that otherwise only grows -- runs a light
// prune every so often rather than on every call.
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= windowMs) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Fixed-window rate limit. `key` should uniquely identify the caller (e.g.
 * `analyze:${userId}`) -- callers in different routes should prefix their
 * key so limits don't collide across endpoints.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count < limit) {
    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.ceil((entry.windowStart + windowMs - now) / 1000);
  return { allowed: false, retryAfterSeconds };
}
