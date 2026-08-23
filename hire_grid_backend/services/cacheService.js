/**
 * Reusable performance memory cache service with support for custom TTLs
 * and wildcard pattern-based invalidation. Can be swapped for Redis later.
 */
class CacheService {
  constructor() {
    this.store = new Map();
  }

  /**
   * Retrieves a value from the cache if it exists and has not expired
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Stores a value in the cache with a specified TTL (in seconds)
   */
  set(key, value, ttlSeconds = 60) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, {
      value,
      expiresAt
    });
    return true;
  }

  /**
   * Deletes a specific cache key
   */
  delete(key) {
    return this.store.delete(key);
  }

  /**
   * Invalidates all cache keys matching a pattern string (e.g. "modules" or "companies")
   */
  invalidatePattern(pattern) {
    let invalidatedCount = 0;
    const regex = new RegExp(pattern, "i");
    
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        invalidatedCount++;
      }
    }
    return invalidatedCount;
  }

  /**
   * Clears the entire cache store
   */
  clear() {
    this.store.clear();
    return true;
  }
}

module.exports = new CacheService();
