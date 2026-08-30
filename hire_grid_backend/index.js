require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const { initDb } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy behind reverse proxies (Render, Nginx, Cloudflare)
app.set("trust proxy", 1);

// Security Headers using helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com"],
        connectSrc: ["'self'", "https://oauth2.googleapis.com", "https://*.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Enable CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://hire-grid-chi.vercel.app",
      "https://hire-grid-web-version.vercel.app",
      "https://hire-grid-web-version-qwva.vercel.app"
    ];

if (process.env.FRONTEND_URL) {
  const urls = process.env.FRONTEND_URL.split(",").map((u) => u.trim());
  urls.forEach((url) => {
    if (!allowedOrigins.includes(url)) {
      allowedOrigins.push(url);
    }
  });
}

app.use(
  cors({
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
  })
);

// Response Compression
app.use(compression());

// Standard Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Performance Timing Middleware
app.use((req, res, next) => {
  if (req.originalUrl === "/health" || req.path === "/health") {
    return next();
  }
  const start = performance.now();
  res.on("finish", () => {
    const duration = (performance.now() - start).toFixed(2);
    if (process.env.NODE_ENV !== "production" && duration > 200) {
      console.log(`[PERF] ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  next();
});

// Health check route (Render wake-up handling)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Database Readiness check route
app.get("/ready", async (req, res) => {
  try {
    const { pool } = require("./config/db");
    await pool.query("SELECT 1");
    res.json({ status: "ready" });
  } catch (err) {
    console.error("[READINESS CHECK FAILED]:", err.message);
    res.status(503).json({ status: "unready", error: "Database not reachable" });
  }
});

// Initialize Database & Seeds
initDb();

// Start Background Daily Leaderboard Scheduler
const { startScheduler } = require("./utils/scheduler");
startScheduler();

// Load Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/storage", require("./routes/storageRoutes"));
app.use("/api/placement-mission", require("./routes/placementMissionRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/uploads", express.static(require("./services/storageService").LOCAL_UPLOADS_DIR));

// Base health route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PostgreSQL Express backend is running.",
  });
});

// Centralized Express Error Handler (Blocks database error leakages in production)
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]:", err.stack || err);
  
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === "production"
    ? "An unexpected error occurred on the server. Please try again later."
    : err.message || "Internal Server Error";
    
  res.status(status).json({
    success: false,
    error: message
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful Shutdown Handlers (Render redeploys and restarts)
const { pool } = require("./config/db");
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    pool.end(() => {
      console.log("Database connection pool closed.");
      process.exit(0);
    });
  });
  
  // Force shutdown if connections do not close in 10s
  setTimeout(() => {
    console.error("Forceful shutdown triggered.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Global uncaught process exception handlers to prevent random crashes
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]:", err.stack || err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED REJECTION]: at:", promise, "reason:", reason);
});
