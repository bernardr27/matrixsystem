export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type CacheBackend = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  clearExpired(now?: number): Promise<number>;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

class MemoryCacheBackend implements CacheBackend {
  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    const existing = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!existing || existing.expiresAt <= now) {
      if (existing) memoryCache.delete(key);
      return null;
    }
    return existing.value;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const now = Date.now();
    memoryCache.set(key, {
      value,
      expiresAt: now + ttlSeconds * 1000
    });
  }

  async clearExpired(now = Date.now()): Promise<number> {
    let removed = 0;
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        memoryCache.delete(key);
        removed += 1;
      }
    }
    return removed;
  }
}

type RedisClientLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { EX?: number }): Promise<unknown>;
  connect?: () => Promise<unknown>;
  isOpen?: boolean;
};

class RedisCacheBackend implements CacheBackend {
  constructor(private readonly client: RedisClientLike, private readonly prefix = "matrix:cache:") {}

  private k(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(this.k(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const payload = JSON.stringify(value);
    await this.client.set(this.k(key), payload, { EX: ttlSeconds });
  }

  async clearExpired(): Promise<number> {
    return 0;
  }
}

let activeBackend: CacheBackend = new MemoryCacheBackend();

export function configureCacheBackend(backend: CacheBackend): void {
  activeBackend = backend;
}

export async function configureRedisCacheFromEnv(
  env: NodeJS.ProcessEnv = process.env
): Promise<{ enabled: boolean; reason: string }> {
  const redisUrl = env.REDIS_URL;
  if (!redisUrl) {
    activeBackend = new MemoryCacheBackend();
    return { enabled: false, reason: "REDIS_URL not set; using memory cache" };
  }

  try {
    const redis = (await import("redis") as unknown) as {
      createClient: (options?: { url?: string }) => RedisClientLike;
    };
    const client = redis.createClient({ url: redisUrl });
    if (client.connect && !client.isOpen) {
      await client.connect();
    }
    const prefix = env.REDIS_CACHE_PREFIX || "matrix:cache:";
    activeBackend = new RedisCacheBackend(client, prefix);
    return { enabled: true, reason: `Redis cache enabled (${prefix})` };
  } catch (error) {
    activeBackend = new MemoryCacheBackend();
    const message = error instanceof Error ? error.message : String(error);
    return { enabled: false, reason: `Redis unavailable (${message}); using memory cache` };
  }
}

export function clearExpiredCache(now = Date.now()): number {
  if (activeBackend instanceof MemoryCacheBackend) {
    let removed = 0;
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        memoryCache.delete(key);
        removed += 1;
      }
    }
    return removed;
  }
  return 0;
}

export async function cachedQuery<T>(key: string, fn: () => Promise<T>, ttlSeconds = 300): Promise<T> {
  const existing = await activeBackend.get<T>(key);
  if (existing !== null) {
    return existing;
  }

  const value = await fn();
  await activeBackend.set(key, value, ttlSeconds);
  return value;
}

export async function getCachedOrNull<T>(key: string): Promise<T | null> {
  return activeBackend.get<T>(key);
}

export async function setCached<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  await activeBackend.set(key, value, ttlSeconds);
}
