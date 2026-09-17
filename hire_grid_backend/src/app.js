const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const path = require("path");

const config = require("./config");
const { corsOptions } = require("./config/cors");
const { helmetOptions } = require("./config/security");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");
const notFound = require("./middlewares/notFound.middleware");
const requestTimeout = require("./middlewares/timeout.middleware");
const { pool } = require("./database/connection");
const storageService = require("./services/storage.service");

const app = express();

// Trust proxy behind reverse proxies (Render, Nginx, Cloudflare)
app.set("trust proxy", 1);

// Security Headers using helmet
app.use(helmet(helmetOptions));

// Enable CORS
app.use(cors(corsOptions));

// Response Compression
app.use(compression());

// Server-side Request Timeout (18 seconds default)
app.use(requestTimeout(18000));

// Standard Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Performance Timing Middleware (skips health check noise)
app.use((req, res, next) => {
  if (req.originalUrl === "/health" || req.path === "/health" || req.path === "/ping" || req.path === "/ready") {
    return next();
  }
  const start = performance.now();
  res.on("finish", () => {
    const duration = (performance.now() - start).toFixed(2);
    if (config.env !== "production" && duration > 200) {
      console.log(`[PERF] ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  next();
});

// Static Uploads Directory
app.use("/uploads", express.static(storageService.LOCAL_UPLOADS_DIR));

// Lightweight Health & Ping check routes (Instantly returns 200 OK without touching Neon DB compute)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/ping", (req, res) => {
  res.json({ status: "pong", timestamp: Date.now() });
});

// Database Readiness / Keep-Warm route (actively queries Neon DB)
app.get("/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ready", database: "connected", timestamp: Date.now() });
  } catch (err) {
    console.error("[READINESS CHECK FAILED]:", err.message);
    res.status(503).json({ status: "unready", error: "Database not reachable" });
  }
});

// Base root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PostgreSQL Express backend is running.",
  });
});

// Mount All API Routes under /api
app.use("/api", routes);

// 404 Handler for undefined endpoints
app.use(notFound);

// Centralized Express Error Handler
app.use(errorHandler);

module.exports = app;
