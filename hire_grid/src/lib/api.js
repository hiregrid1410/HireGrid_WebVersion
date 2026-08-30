const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_BASE = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;

const inFlightRequests = new Map();

let isServerWaking = false;
let wakingPromise = null;

async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`, { method: "GET" });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.status === "ok";
    }
  } catch (e) {
    // unreachable
  }
  return false;
}

async function checkReady() {
  try {
    const res = await fetch(`${API_URL}/ready`, { method: "GET" });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.status === "ready";
    }
  } catch (e) {
    // unreachable
  }
  return false;
}

async function waitForServerToWake() {
  if (wakingPromise) {
    return wakingPromise;
  }

  wakingPromise = (async () => {
    isServerWaking = true;
    window.dispatchEvent(new CustomEvent("server-waking"));

    const maxRetries = 30; // 90 seconds max wait
    let attempts = 0;
    let isWoke = false;
    
    // 1. Wait for Node.js process to start accepting requests
    while (attempts < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;
      const ok = await checkHealth();
      if (ok) {
        isWoke = true;
        break;
      }
    }

    // 2. Wait for database connection readiness
    if (isWoke) {
      attempts = 0;
      while (attempts < 10) { // Give database up to 30 seconds more if process is already up
        const ready = await checkReady();
        if (ready) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
        attempts++;
      }
    }

    isServerWaking = false;
    wakingPromise = null;
    window.dispatchEvent(new CustomEvent("server-ready"));
  })();

  return wakingPromise;
}

async function request(method, path, body = null) {
  if (method === "GET" && inFlightRequests.has(path)) {
    return inFlightRequests.get(path);
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
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const reqPromise = (async () => {
    let attemptsLeft = 2;
    while (attemptsLeft > 0) {
      try {
        const res = await fetch(`${API_BASE}${path}`, options);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const message =
            data.error ||
            data.message ||
            `Request failed with status ${res.status}`;

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

          // If it is a 503 Service Unavailable, or a database connection error
          const lowercaseMsg = message.toLowerCase();
          const isDbOrUnavailable = res.status === 503 ||
            lowercaseMsg.includes("econnreset") ||
            lowercaseMsg.includes("connection reset") ||
            lowercaseMsg.includes("timeout") ||
            lowercaseMsg.includes("starting up") ||
            lowercaseMsg.includes("too many connections") ||
            lowercaseMsg.includes("admin_shutdown");

          if (isDbOrUnavailable) {
            // Fallthrough to the catch block to wait/retry
            throw new Error(`DB_CONN_ERROR: ${message}`);
          }

          throw new Error(message);
        }

        return data;
      } catch (err) {
        const isDbConnError = err.message && err.message.startsWith("DB_CONN_ERROR:");
        // If it is a business/HTTP error thrown by us above (not a DB_CONN_ERROR), don't retry
        if (
          err.message &&
          !isDbConnError &&
          !err.message.includes("Failed to fetch") &&
          !err.message.includes("NetworkError") &&
          !err.message.includes("Network Error") &&
          !err.message.includes("status") &&
          !err.message.includes("fetch")
        ) {
          throw err;
        }

        // Check if server and DB are already awake/healthy
        const isHealthy = await checkHealth();
        const isReady = isHealthy ? await checkReady() : false;
        if (isHealthy && isReady) {
          console.error("API Error (Server & DB are ready):", err);
          const finalErr = isDbConnError ? new Error(err.message.replace("DB_CONN_ERROR: ", "")) : err;
          throw finalErr;
        }

        // Server/DB is sleeping/waking. Wait for it.
        console.log("Server/DB is sleeping/waking. Waiting for it to start...");
        await waitForServerToWake();

        attemptsLeft--;
        if (attemptsLeft === 0) {
          const finalErr = isDbConnError ? new Error(err.message.replace("DB_CONN_ERROR: ", "")) : err;
          throw finalErr;
        }
      }
    }
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
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};