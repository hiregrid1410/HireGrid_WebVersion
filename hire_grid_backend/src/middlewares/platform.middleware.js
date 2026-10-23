const crypto = require("crypto");

/**
 * Constant-time safe string comparison preventing timing attacks.
 */
function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Platform Detection & Security Middleware
 *
 * Implements:
 * - A1: Missing/unrecognized x-platform header defaults to "app" for content filtering.
 *       Device limit stays active/enforced for missing header (rawPlatform is null).
 * - A2: Device-limit bypass for the app strictly requires BOTH:
 *       1) x-platform: app (case-insensitive)
 *       2) x-app-key matching process.env.APP_API_KEY via timingSafeEqual
 *       If APP_API_KEY is unset or key mismatch/missing, treated as untrusted (device limit enforced).
 * - A8: Injects "Vary: x-platform, x-app-key" to ensure caches do not cross-serve responses.
 */
function platformMiddleware(req, res, next) {
  const rawPlatformHeader = req.headers["x-platform"];
  const rawKeyHeader = req.headers["x-app-key"];

  let rawPlatform = null;
  if (typeof rawPlatformHeader === "string") {
    const p = rawPlatformHeader.trim().toLowerCase();
    if (p === "web" || p === "app") {
      rawPlatform = p;
    }
  }

  // A1: Missing x-platform header treated as "app" for content filtering
  // Web clients explicitly send "web", Flutter mobile sends "app".
  // Legacy clients lacking header default to "app" content.
  const contentPlatform = rawPlatform || "app";

  // A2: Trusted app check
  const serverAppKey = process.env.APP_API_KEY;
  let isTrustedApp = false;

  if (
    rawPlatform === "app" &&
    typeof serverAppKey === "string" &&
    serverAppKey.length > 0 &&
    typeof rawKeyHeader === "string" &&
    rawKeyHeader.length > 0
  ) {
    isTrustedApp = safeCompare(rawKeyHeader, serverAppKey);
  }

  req.rawPlatform = rawPlatform;     // "web" | "app" | null
  req.platform = contentPlatform;    // "web" | "app"
  req.isTrustedApp = isTrustedApp;    // boolean

  // Set Vary headers for HTTP caching compliance
  res.setHeader("Vary", "x-platform, x-app-key");

  next();
}

module.exports = {
  platformMiddleware,
  safeCompare,
};
