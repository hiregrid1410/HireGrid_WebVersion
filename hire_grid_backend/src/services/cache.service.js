/**
 * Bounded in-memory performance cache service with TTL and wildcard invalidation.
 * Protects memory footprint with MAX_ENTRIES cap and periodic expired-key cleanup.
 */
class CacheService {
  constructor(maxEntries = 500) {
    this.store = new Map();
    this.maxEntries = maxEntries;

    // Periodic sweep every 5 minutes to prevent stale key accumulation
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, 300000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref(); // Allow node process to exit cleanly if idle
    }
  }

  /**
   * Cleans up expired cache items
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
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
   * Stores a value in the cache with a specified TTL (in seconds) and bounded eviction
   */
  set(key, value, ttlSeconds = 60) {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest entry (Map insertion order)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, {
      value,
      expiresAt,
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
