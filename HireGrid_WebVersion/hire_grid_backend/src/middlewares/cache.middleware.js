/**
 * In-Memory Response Caching Middleware
 * Caches read-heavy, low-frequency mutation endpoints (branches, plans, companies, modules, stats)
 * with TTL and automated cache invalidation on write methods (POST, PUT, DELETE).
 */

const memoryCache = new Map();
const DEFAULT_TTL_MS = 60000; // 1 minute default TTL

function cacheResponse(ttlMs = DEFAULT_TTL_MS) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = req.originalUrl || req.url;
    const now = Date.now();
    const cachedItem = memoryCache.get(cacheKey);

    if (cachedItem && (now - cachedItem.timestamp < ttlMs)) {
      res.setHeader("X-Cache-Status", "HIT");
      return res.json(cachedItem.data);
    }

    // Capture res.json to cache payload
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(cacheKey, {
          data: body,
          timestamp: Date.now(),
        });
        res.setHeader("X-Cache-Status", "MISS");
      }
      return originalJson(body);
    };

    next();
  };
}

function clearCache(pattern = null) {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
}

// Middleware that automatically invalidates related cache on mutations
function invalidateCacheMiddleware(pattern = null) {
  return (req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      res.on("finish", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          clearCache(pattern);
        }
      });
    }
    next();
  };
}

module.exports = {
  cacheResponse,
  clearCache,
  invalidateCacheMiddleware,
};
