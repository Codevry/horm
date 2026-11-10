import IORedis from 'ioredis';

/**
 * shared redis connection, or null when REDIS_URL is not set
 * (notifications are then disabled and rate limiting falls back to memory)
 */
export const redis: IORedis | null = Bun.env.REDIS_URL
  ? new IORedis(Bun.env.REDIS_URL, { maxRetriesPerRequest: null })
  : null;

redis?.on('error', error => console.error('[Redis]', error.message));
