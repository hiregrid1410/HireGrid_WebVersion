const { pool } = require("../config/db");
async function test() {
  try {
    console.log("Querying database using pool from config/db...");
    const res = await pool.query("SELECT NOW()");
    console.log("Success:", res.rows[0]);
  } catch (err) {
    console.error("Failed:", err);
  } finally {
    pool.end();
  }
}
test();
