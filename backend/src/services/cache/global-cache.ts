/**
 * Global Cache Instance and Middleware
 *
 * Provides application-wide caching with specialized caches
 * for different data types and endpoints.
 */

import { MemoryCache } from './memory-cache';
import { Request, Response, NextFunction } from 'express';

// Cache instances for different data types
export const productCache = new MemoryCache<any>({
  keyPrefix: 'products',
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  cleanupIntervalMs: 60 * 1000,
});

export const categoryCache = new MemoryCache<any>({
  keyPrefix: 'categories',
  ttlMs: 10 * 60 * 1000, // 10 minutes
  maxSize: 200,
  cleanupIntervalMs: 60 * 1000,
});

export const inventoryCache = new MemoryCache<any>({
  keyPrefix: 'inventory',
  ttlMs: 30 * 1000, // 30 seconds (inventory changes frequently)
  maxSize: 500,
  cleanupIntervalMs: 30 * 1000,
});

export const settingsCache = new MemoryCache<any>({
  keyPrefix: 'settings',
  ttlMs: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  cleanupIntervalMs: 5 * 60 * 1000,
});

export const reportCache = new MemoryCache<any>({
  keyPrefix: 'reports',
  ttlMs: 2 * 60 * 1000, // 2 minutes
  maxSize: 100,
  cleanupIntervalMs: 60 * 1000,
});

// Generic query cache
export const queryCache = new MemoryCache<any>({
  keyPrefix: 'query',
  ttlMs: 60 * 1000, // 1 minute
  maxSize: 500,
  cleanupIntervalMs: 30 * 1000,
});

// Cache key generators
export function getCacheKey(
  type: string,
  storeId: string,
  ...parts: (string | number | undefined)[]
): string {
  return [type, storeId, ...parts.filter(Boolean)].join(':');
}

// Cache middleware factory
export function cacheMiddleware(
  cache: MemoryCache<any>,
  ttlMs?: number,
  keyGenerator?: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const storeId = (req as any).storeId || 'global';
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `${storeId}:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json to cache the response
      res.json = (body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, body, ttlMs).catch(console.error);
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

// Cache invalidation helpers
export async function invalidateProductCache(storeId: string, productId?: string) {
  if (productId) {
    await productCache.delete(`${storeId}:${productId}`);
  }
  await productCache.deletePattern(`${storeId}:*`);
  await inventoryCache.deletePattern(`${storeId}:*`);
}

export async function invalidateCategoryCache(storeId: string) {
  await categoryCache.deletePattern(`${storeId}:*`);
}

export async function invalidateInventoryCache(storeId: string, productId?: string) {
  if (productId) {
    await inventoryCache.delete(`${storeId}:${productId}`);
  }
  await inventoryCache.deletePattern(`${storeId}:*`);
}

export async function invalidateSettingsCache(storeId: string) {
  await settingsCache.deletePattern(`${storeId}:*`);
}

export async function invalidateAllCaches(storeId: string) {
  await Promise.all([
    productCache.deletePattern(`${storeId}:*`),
    categoryCache.deletePattern(`${storeId}:*`),
    inventoryCache.deletePattern(`${storeId}:*`),
    settingsCache.deletePattern(`${storeId}:*`),
    reportCache.deletePattern(`${storeId}:*`),
    queryCache.deletePattern(`${storeId}:*`),
  ]);
}

// Get all cache stats
export function getAllCacheStats() {
  return {
    products: productCache.getStats(),
    categories: categoryCache.getStats(),
    inventory: inventoryCache.getStats(),
    settings: settingsCache.getStats(),
    reports: reportCache.getStats(),
    query: queryCache.getStats(),
  };
}
