const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("Checking database connection and schemas...");
    const versionRes = await pool.query("SELECT version()");
    console.log("PostgreSQL Version:", versionRes.rows[0].version);

    // List all tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log("\nTables in database:");
    tablesRes.rows.forEach(r => console.log(` - ${r.table_name}`));

    // List migrations
    try {
      const migsRes = await pool.query("SELECT * FROM schema_migrations");
      console.log("\nSchema Migrations:");
      migsRes.rows.forEach(r => console.log(` - version: ${r.version}, run_at: ${r.run_at}`));
    } catch (e) {
      console.log("schema_migrations table does not exist or error:", e.message);
    }

  } catch (err) {
    console.error("Database connection failed:", err.message);
  } finally {
    await pool.end();
  }
}

run();
