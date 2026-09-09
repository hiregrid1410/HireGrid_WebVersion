const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_BASE = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;

const inFlightRequests = new Map();
const responseCache = new Map();
const CACHE_TTL = 30000; // 30 seconds default TTL

export function invalidateCache(pathPattern) {
  if (!pathPattern) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(pathPattern)) {
      responseCache.delete(key);
    }
  }
}

// Server readiness status
let isBackendReady = false;
let isServerWaking = false;
let wakingPromise = null;

export function getIsBackendReady() {
  return isBackendReady;
}

export function setIsBackendReady(status) {
  isBackendReady = Boolean(status);
}

// Lightweight health check (does not hit heavy SQL)
export async function checkHealth(timeoutMs = 4000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${API_URL}/health`, { 
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.status === "ok") {
        isBackendReady = true;
        return true;
      }
    }
  } catch (e) {
    // unreachable or timed out
  }
  return false;
}

// Database Readiness check
export async function checkReady(timeoutMs = 5000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${API_URL}/ready`, { 
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.status === "ready") {
        isBackendReady = true;
        return true;
      }
    }
  } catch (e) {
    // unreachable or timed out
  }
  return false;
}

export async function waitForServerToWake(onProgress = null) {
  if (wakingPromise) {
    return wakingPromise;
  }

  wakingPromise = (async () => {
    isServerWaking = true;
    window.dispatchEvent(new CustomEvent("server-waking", { detail: { stage: "starting" } }));
    if (onProgress) onProgress("starting");

    const maxHealthChecks = 35; // ~70-90 seconds max wait for cold Render instance
    let attempts = 0;
    let isWoke = false;

    // 1. Wait for Node.js process to start responding on /health
    while (attempts < maxHealthChecks) {
      attempts++;
      const stage = attempts > 5 ? "waking" : "connecting";
      window.dispatchEvent(new CustomEvent("server-waking", { detail: { stage, attempt: attempts } }));
      if (onProgress) onProgress(stage);

      const ok = await checkHealth(3000);
      if (ok) {
        isWoke = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 2. Wait for database readiness if process is up
    if (isWoke) {
      attempts = 0;
      while (attempts < 10) {
        const ready = await checkReady(4000);
        if (ready) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      }
    }

    isBackendReady = true;
    isServerWaking = false;
    wakingPromise = null;
    window.dispatchEvent(new CustomEvent("server-ready"));
  })();

  return wakingPromise;
}

// Ensure backend is reachable before initial request stampede
export async function ensureBackendReady() {
  if (isBackendReady) return true;
  const initialCheck = await checkHealth(2500);
  if (initialCheck) {
    isBackendReady = true;
    return true;
  }
  await waitForServerToWake();
  return isBackendReady;
}

async function request(method, path, body = null, requestOptions = {}) {
  const now = Date.now();
  if (method === "GET" && !requestOptions.bypassCache) {
    const cached = responseCache.get(path);
    if (cached && (now - cached.timestamp < (requestOptions.ttl || CACHE_TTL))) {
      return cached.data;
    }
  }

  if (method === "GET" && inFlightRequests.has(path)) {
    return inFlightRequests.get(path);
  }

  if (method !== "GET" && !requestOptions.bypassCacheClear) {
    responseCache.clear();
  }

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    signal: requestOptions.signal,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const reqPromise = (async () => {
    // Only retry idempotent GET requests; do not retry destructive POST/PUT/DELETE
    const isIdempotent = method === "GET";
    let attemptsLeft = isIdempotent ? 3 : 1;
    let lastError = null;

    while (attemptsLeft > 0) {
      attemptsLeft--;
      try {
        const res = await fetch(`${API_BASE}${path}`, options);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const message =
            data.error ||
            data.message ||
            `Request failed with status ${res.status}`;

          // Only log out on explicit 401 Unauthorized from backend
          if (res.status === 401 || (res.status === 404 && path.includes("/users/"))) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            if (
              window.location.pathname !== "/" &&
              window.location.pathname !== "/admin"
            ) {
              window.location.href = "/";
            }
          }

          // Infrastructure/Waking error checks (502, 503, 504, DB connection resets)
          const lowercaseMsg = message.toLowerCase();
          const isDbOrUnavailable =
            res.status === 503 ||
            res.status === 502 ||
            res.status === 504 ||
            lowercaseMsg.includes("econnreset") ||
            lowercaseMsg.includes("connection reset") ||
            lowercaseMsg.includes("timeout") ||
            lowercaseMsg.includes("starting up") ||
            lowercaseMsg.includes("too many connections") ||
            lowercaseMsg.includes("admin_shutdown");

          if (isDbOrUnavailable) {
            throw new Error(`DB_CONN_ERROR: ${message}`);
          }

          throw new Error(message);
        }

        // Successful request confirms backend is awake
        isBackendReady = true;

        if (method === "GET") {
          responseCache.set(path, {
            data,
            timestamp: Date.now(),
          });
        }

        return data;
      } catch (err) {
        if (err.name === "AbortError") {
          throw err;
        }

        lastError = err;
        const isDbConnError = err.message && err.message.startsWith("DB_CONN_ERROR:");
        const isNetworkOrFetchError =
          isDbConnError ||
          !err.message ||
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("Network Error") ||
          err.message.includes("status") ||
          err.message.includes("fetch");

        // Non-network business error or non-idempotent mutation -> throw immediately
        if (!isNetworkOrFetchError || !isIdempotent) {
          throw err;
        }

        // Safe retry loop for GET requests
        if (attemptsLeft > 0) {
          const isHealthy = await checkHealth(2000);
          if (!isHealthy) {
            await waitForServerToWake();
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
          continue;
        }

        // Retries exhausted
        const finalErr = isDbConnError ? new Error(err.message.replace("DB_CONN_ERROR: ", "")) : err;
        throw finalErr;
      }
    }

    throw lastError || new Error("Connection failed after retries.");
  })();

  if (method === "GET") {
    inFlightRequests.set(path, reqPromise);
    reqPromise.finally(() => {
      inFlightRequests.delete(path);
    });
  }

  return reqPromise;
}

export function getDeviceId() {
  let deviceId = localStorage.getItem("hiregrid_device_id");
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("hiregrid_device_id", deviceId);
  }
  return deviceId;
}

export function getDeviceName() {
  const ua = navigator.userAgent || "";
  let browser = "Browser";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  
  let os = "Device";
  if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh")) os = "Mac";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone")) os = "iPhone";

  return `${browser} on ${os}`;
}

export const api = {
  get: (path, options = {}) => request("GET", path, null, options),
  post: (path, body, options = {}) => request("POST", path, body, options),
  put: (path, body, options = {}) => request("PUT", path, body, options),
  delete: (path, options = {}) => request("DELETE", path, null, options),
};