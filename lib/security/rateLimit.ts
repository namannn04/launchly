import "server-only";

import IORedis from "ioredis";

type RateLimitInput = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type LocalEntry = {
  count: number;
  expiresAt: number;
};

const localStore = new Map<string, LocalEntry>();

function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return null;
  }

  return new IORedis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  });
}

function nowMs() {
  return Date.now();
}

function localRateLimit({ key, limit, windowSeconds }: RateLimitInput): RateLimitResult {
  const now = nowMs();
  const current = localStore.get(key);

  if (!current || current.expiresAt <= now) {
    localStore.set(key, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: windowSeconds,
    };
  }

  current.count += 1;
  localStore.set(key, current);

  const retryAfterSeconds = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));

  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds,
  };
}

export async function enforceRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    return localRateLimit(input);
  }

  const redisKey = `rate_limit:${input.key}`;

  try {
    await redis.connect();
    const current = await redis.incr(redisKey);

    if (current === 1) {
      await redis.expire(redisKey, input.windowSeconds);
    }

    const ttl = await redis.ttl(redisKey);

    return {
      allowed: current <= input.limit,
      remaining: Math.max(0, input.limit - current),
      retryAfterSeconds: Math.max(1, ttl),
    };
  } catch {
    return localRateLimit(input);
  } finally {
    await redis.quit().catch(() => undefined);
  }
}
