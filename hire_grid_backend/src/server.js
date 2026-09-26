const app = require("./app");
const config = require("./config");
const { initDb } = require("./database/init");
const { pool } = require("./database/connection");
const { startScheduler } = require("./services/scheduler.service");

const PORT = config.port;

let runningServer = null;

async function startServer() {
  // 1. Initialize Database Schema & Run Safe Incremental Migrations
  await initDb();

  // 2. Start Background Daily Leaderboard Scheduler
  startScheduler();

  // 3. Start HTTP Server
  runningServer = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [Env: ${config.env}]`);
  });

  return runningServer;
}

startServer();

// Graceful Shutdown Handlers (Render redeploys and restarts)
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  if (runningServer) {
    runningServer.close(() => {
      console.log("HTTP server closed.");
      pool.end(() => {
        console.log("Database connection pool closed.");
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
  
  // Force shutdown if connections do not close within 10s
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

module.exports = app;
