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

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(origin) ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

module.exports = {
  corsOptions,
  allowedOrigins
};
