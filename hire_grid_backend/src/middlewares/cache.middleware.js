/**
 * In-Memory Response Caching Middleware
 * Caches read-heavy, low-frequency mutation endpoints with TTL.
 *
 * Implements A8:
 * - Composite cache keys: cache:${platform}:${roleGroup}:${url}
 *   Guarantees web and app, and student/admin/public never get each other's cached response.
 * - Injects "Vary: x-platform, x-app-key" header on all cached responses.
 */

const memoryCache = new Map();
const DEFAULT_TTL_MS = 60000; // 1 minute default TTL

function getCacheKey(req) {
  const platform = req.platform || (req.headers["x-platform"]?.toLowerCase() === "web" ? "web" : "app");
  const roleGroup = req.user?.role
    ? (["admin", "content_manager"].includes(req.user.role) ? "admin" : "student")
    : "public";
  const url = req.originalUrl || req.url;
  return `cache:${platform}:${roleGroup}:${url}`;
}

function cacheResponse(ttlMs = DEFAULT_TTL_MS) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Set HTTP Vary header for CDN/browser compliance
    res.setHeader("Vary", "x-platform, x-app-key");

    const cacheKey = getCacheKey(req);
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
  getCacheKey,
  cacheResponse,
  clearCache,
  invalidateCacheMiddleware,
  _memoryCache: memoryCache, // Exposed for test assertions
};
