/**
 * Shared in-memory cache for the notification config GET endpoint.
 *
 * Extracted from `/api/notifications/config/route.ts` so other endpoints
 * (notably the Telegram link routes and webhook) can invalidate a user's
 * cached config after they mutate underlying data (e.g. telegram_chat_id).
 *
 * Note: this is a per-process Map, so on Vercel each cold-start function
 * instance has its own copy. That's fine — TTL-based invalidation handles
 * eventual consistency across instances.
 */

const CONFIG_CACHE_TTL_MS = 15 * 60 * 1000;

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

export function getCacheKey(userId: string, chainId?: number): string {
  return `${userId}:${chainId ?? "all"}`;
}

export function getCachedConfig(cacheKey: string): { hit: true; data: unknown } | { hit: false; data: null } {
  const entry = cache.get(cacheKey);
  if (!entry) return { hit: false, data: null };
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey);
    return { hit: false, data: null };
  }
  return { hit: true, data: entry.data };
}

export function setCachedConfig(cacheKey: string, data: unknown): void {
  cache.set(cacheKey, { data, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS });
}

/** Invalidate every cached entry belonging to a given user_id. */
export function invalidateUserConfigCache(userId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${userId}:`)) cache.delete(key);
  }
}
