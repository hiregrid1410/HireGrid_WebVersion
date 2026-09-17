const { Pool } = require("pg");
const env = require("./env");

// Ensure DATABASE_URL uses Neon's pooled connection string (-pooler) when on Neon
let connectionString = env.DATABASE_URL;
if (connectionString && connectionString.includes("neon.tech") && !connectionString.includes("-pooler")) {
  connectionString = connectionString.replace(".neon.tech", "-pooler.neon.tech");
}

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 20000,
    })
  : new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: (env.DB_HOST && env.DB_HOST.includes("neon.tech"))
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 20000,
    });

// Handle pool errors so idle connection socket drops don't crash Node process
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client:", err.message);
});

// Retry delay configuration: 300ms, 700ms, 1500ms
const RETRY_DELAYS = [300, 700, 1500];

// Helper function to check if an error is a database connection/socket issue
function isDbConnectionError(err) {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const code = (err.code || "").toString().toUpperCase();
  return (
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    code === "ETIMEDOUT" ||
    code === "57P01" || // admin_shutdown
    code === "57P02" || // crash_shutdown
    code === "57P03" || // cannot_connect_now
    msg.includes("econnreset") ||
    msg.includes("connection terminated unexpectedly") ||
    msg.includes("terminated due to administrator command") ||
    msg.includes("socket") ||
    msg.includes("read") ||
    msg.includes("connection timeout") ||
    msg.includes("server closed the connection")
  );
}

// Wrapper for pool.query with retry logic
const originalPoolQuery = pool.query;
pool.query = function (text, params, callback) {
  let actualParams = params;
  let actualCallback = callback;
  if (typeof params === "function") {
    actualCallback = params;
    actualParams = undefined;
  }

  if (actualCallback) {
    let attempts = 0;
    const maxAttempts = 3;

    const tryQuery = () => {
      originalPoolQuery.call(pool, text, actualParams, (err, result) => {
        if (err) {
          if (isDbConnectionError(err) && attempts < maxAttempts) {
            const delay = RETRY_DELAYS[attempts] || 1000;
            attempts++;
            console.warn(`[DB pool.query callback warning] Connection error: ${err.message}. Retrying (attempt ${attempts}/${maxAttempts}) in ${delay}ms...`);
            setTimeout(tryQuery, delay);
            return;
          }
          return actualCallback(err, result);
        }
        return actualCallback(null, result);
      });
    };

    tryQuery();
    return;
  }

  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const result = await originalPoolQuery.call(pool, text, actualParams);
        resolve(result);
        return;
      } catch (err) {
        if (isDbConnectionError(err) && attempts < maxAttempts - 1) {
          const delay = RETRY_DELAYS[attempts] || 1000;
          attempts++;
          console.warn(`[DB pool.query promise warning] Connection error: ${err.message}. Retrying (attempt ${attempts}/${maxAttempts}) in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        reject(err);
        return;
      }
    }
  });
};

// Wrapper for pool.connect with retry logic
const originalPoolConnect = pool.connect;
pool.connect = function (callback) {
  if (callback) {
    let attempts = 0;
    const maxAttempts = 3;

    const tryConnect = () => {
      originalPoolConnect.call(pool, (err, client, release) => {
        if (err) {
          if (isDbConnectionError(err) && attempts < maxAttempts) {
            const delay = RETRY_DELAYS[attempts] || 1000;
            attempts++;
            console.warn(`[DB pool.connect callback warning] Connection error: ${err.message}. Retrying (attempt ${attempts}/${maxAttempts}) in ${delay}ms...`);
            setTimeout(tryConnect, delay);
            return;
          }
          return callback(err, client, release);
        }
        return callback(null, client, release);
      });
    };

    tryConnect();
    return;
  }

  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const client = await originalPoolConnect.apply(pool);
        resolve(client);
        return;
      } catch (err) {
        if (isDbConnectionError(err) && attempts < maxAttempts - 1) {
          const delay = RETRY_DELAYS[attempts] || 1000;
          attempts++;
          console.warn(`[DB pool.connect promise warning] Connection error: ${err.message}. Retrying (attempt ${attempts}/${maxAttempts}) in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        reject(err);
        return;
      }
    }
  });
};

module.exports = { pool };
