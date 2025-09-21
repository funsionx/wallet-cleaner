/* eslint-disable @typescript-eslint/no-explicit-any */
type CacheEntry<T> = { v: T; exp: number };

export type Buckets = {
  bal: Map<string, CacheEntry<any>>;
  meta: Map<string, CacheEntry<any>>;
  price: Map<string, CacheEntry<any>>;
};

const g = globalThis as unknown as { __WL_CACHE__?: Buckets };
if (!g.__WL_CACHE__) {
  g.__WL_CACHE__ = {
    bal: new Map(),
    meta: new Map(),
    price: new Map(),
  };
}
export const CACHE = g.__WL_CACHE__ as Buckets;

export function cacheGet<T>(bucket: keyof Buckets, key: string): T | null {
  const map = CACHE[bucket] as Map<string, CacheEntry<T>>;
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    map.delete(key);
    return null;
  }
  return hit.v;
}

export function cacheSet<T>(
  bucket: keyof Buckets,
  key: string,
  v: T,
  ttlMs: number
) {
  const map = CACHE[bucket] as Map<string, CacheEntry<T>>;
  map.set(key, { v, exp: Date.now() + ttlMs });
}
