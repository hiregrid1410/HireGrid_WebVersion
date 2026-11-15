const env = require("./env");

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://hire-grid-chi.vercel.app",
  "https://hire-grid-web-version.vercel.app",
  "https://hire-grid-web-version-qwva.vercel.app"
];

const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : defaultOrigins;

if (env.FRONTEND_URL) {
  const urls = env.FRONTEND_URL.split(",").map((u) => u.trim());
  urls.forEach((url) => {
    if (!allowedOrigins.includes(url)) {
      allowedOrigins.push(url);
    }
  });
}

const defaultAllowedHeaders = [
  "Origin",
  "X-Requested-With",
  "Content-Type",
  "Accept",
  "Authorization",
  "x-platform",
  "X-Platform",
  "x-app-key",
  "X-App-Key",
  "x-client-platform",
  "X-Client-Platform",
  "x-app-version",
  "X-App-Version",
  "x-device-id",
  "X-Device-Id",
  "x-access-token",
  "X-Access-Token",
];

const corsOptions = (req, callback) => {
  const origin = req.header("Origin");
  let originAllowed = false;

  // Allow requests with no origin (like native mobile apps, curl, server-to-server)
  if (!origin) {
    originAllowed = true;
  } else if (
    allowedOrigins.includes("*") ||
    allowedOrigins.includes(origin) ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  ) {
    originAllowed = true;
  }

  // Include base allowed headers and dynamically reflect any requested headers
  const reqHeaders = req.header("access-control-request-headers");
  const headersSet = new Set(defaultAllowedHeaders);
  if (reqHeaders) {
    reqHeaders.split(",").forEach((h) => {
      const trimmed = h.trim();
      if (trimmed) headersSet.add(trimmed);
    });
  }

  const options = {
    origin: originAllowed,
    credentials: true,
    allowedHeaders: Array.from(headersSet),
    exposedHeaders: ["x-platform", "X-Cache-Status", "Vary"],
  };

  callback(null, options);
};

module.exports = {
  corsOptions,
  allowedOrigins
};
