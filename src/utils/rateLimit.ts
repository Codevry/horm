import type { Context, Next } from 'hono';
import { getConnInfo } from 'hono/bun';
import { redis } from '@/utils/redis.ts';
import type { RateLimitSettings } from '@/entity/entitySettings.ts';

/**
 * Fixed-window rate limit per client IP and form for public form submissions.
 * Limits come from the dashboard settings (global or per form), with
 * RATE_LIMIT_MAX / RATE_LIMIT_WINDOW as the initial defaults.
 *
 *   TRUST_PROXY  "true" when running behind a reverse proxy (Coolify / Traefik / nginx):
 *                the client IP is then read from X-Forwarded-For
 *
 * Counters live in redis when REDIS_URL is set (shared by every app instance),
 * otherwise in memory. If redis is unreachable requests are let through.
 */

const trustProxy = Bun.env.TRUST_PROXY === 'true';

interface Hit {
  count: number;
  resetMs: number; // ms until the window resets
}

// --- in-memory store (single instance only)
const memory = new Map<string, { count: number; reset: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memory) if (entry.reset <= now) memory.delete(key);
}, 60_000).unref();

function hitMemory(key: string, windowMs: number): Hit {
  const now = Date.now();
  let entry = memory.get(key);
  if (!entry || entry.reset <= now) memory.set(key, (entry = { count: 0, reset: now + windowMs }));
  entry.count++;
  return { count: entry.count, resetMs: entry.reset - now };
}

async function hitRedis(key: string, windowMs: number): Promise<Hit> {
  const count = await redis!.incr(key);
  let ttl = await redis!.pttl(key);
  // first hit of the window (or a key that lost its expiry): start the window
  if (count === 1 || ttl < 0) {
    await redis!.pexpire(key, windowMs);
    ttl = windowMs;
  }
  return { count, resetMs: ttl };
}

/**
 * client IP: last X-Forwarded-For entry (added by our own proxy) when TRUST_PROXY=true,
 * otherwise the socket address
 */
export function clientIp(c: Context): string {
  if (trustProxy) {
    const forwarded = c.req.header('x-forwarded-for');
    const last = forwarded?.split(',').pop()?.trim();
    if (last) return last;
    const real = c.req.header('x-real-ip')?.trim();
    if (real) return real;
  }
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * count one submission for (form, client IP); returns a 429 response when over the limit
 */
export async function rateLimit(c: Context, scope: string, limit: RateLimitSettings): Promise<Response | null> {
  if (!(limit.max > 0)) return null;

  const windowMs = limit.window * 1000;
  const key = `horm:ratelimit:records:${scope}:${limit.window}:${clientIp(c)}`;
  let hit: Hit;
  try {
    hit = redis ? await hitRedis(key, windowMs) : hitMemory(key, windowMs);
  } catch (error: any) {
    console.error('[RateLimit] store unavailable, allowing request:', error.message);
    return null;
  }

  const resetSeconds = Math.max(1, Math.ceil(hit.resetMs / 1000));
  c.header('RateLimit-Limit', String(limit.max));
  c.header('RateLimit-Remaining', String(Math.max(0, limit.max - hit.count)));
  c.header('RateLimit-Reset', String(resetSeconds));

  if (hit.count > limit.max) {
    c.header('Retry-After', String(resetSeconds));
    return c.json(
      {
        status: false,
        message: 'Too many submissions',
        error: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
      },
      429,
    );
  }
  return null;
}
