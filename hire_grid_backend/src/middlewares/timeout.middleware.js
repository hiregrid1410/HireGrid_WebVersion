/**
 * Request Timeout Middleware
 * Prevents requests from hanging indefinitely if Neon or downstream dependencies stall.
 * Returns a clean 504 Gateway Timeout error with structured JSON.
 */

const DEFAULT_TIMEOUT_MS = 18000; // 18 seconds (under Render's 30s limit)

function requestTimeout(timeoutMs = DEFAULT_TIMEOUT_MS) {
  return (req, res, next) => {
    // Skip timeout for upload endpoints or health endpoints
    if (req.path.startsWith("/storage/upload") || req.path.startsWith("/health") || req.path === "/ping") {
      return next();
    }

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`[REQUEST TIMEOUT] ${req.method} ${req.originalUrl} exceeded ${timeoutMs}ms limit.`);
        res.status(504).json({
          success: false,
          error: "Request timed out while waiting for server response. The server or database may be waking up.",
          code: "SERVER_TIMEOUT",
        });
      }
    }, timeoutMs);

    // Clear timeout when request finishes
    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));

    next();
  };
}

module.exports = requestTimeout;
