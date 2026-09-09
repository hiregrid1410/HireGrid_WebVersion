const { pool } = require("../../database/connection");
const crypto = require("crypto");

class AuthRepository {
  async findAdminByEmail(email) {
    const result = await pool.query(
      `SELECT id, email, password, role, name, created_at FROM admin_users WHERE email = $1 LIMIT 1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async findFirstAdmin(targetEmail) {
    let result = await pool.query(
      `SELECT * FROM admin_users WHERE email = $1 LIMIT 1`,
      [targetEmail]
    );
    if (result.rows.length === 0) {
      result = await pool.query(`SELECT * FROM admin_users ORDER BY created_at ASC LIMIT 1`);
    }
    return result.rows[0] || null;
  }

  async findContentManagerByEmail(email) {
    const result = await pool.query(
      `SELECT id, email, password, role, name, created_at FROM content_managers WHERE email = $1 LIMIT 1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async findStaffByEmail(email) {
    const result = await pool.query(
      `SELECT id, email, password, role, name, created_at FROM admin_users WHERE email = $1
       UNION ALL
       SELECT id, email, password, role, name, created_at FROM content_managers WHERE email = $2
       LIMIT 1`,
      [email, email]
    );
    return result.rows[0] || null;
  }

  async findUserByEmail(email) {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async findUserByGoogleIdOrEmail(googleId, email) {
    const result = await pool.query(
      `SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1`,
      [googleId, email]
    );
    return result.rows[0] || null;
  }

  async findByIdInTable(table, id) {
    const safeTable = ["users", "admin_users", "content_managers"].includes(table) ? table : "users";
    const result = await pool.query(
      `SELECT * FROM ${safeTable} WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async checkExistingEmail(table, email) {
    const safeTable = ["users", "admin_users", "content_managers"].includes(table) ? table : "users";
    const result = await pool.query(
      `SELECT id FROM ${safeTable} WHERE email = $1 LIMIT 1`,
      [email]
    );
    return result.rows.length > 0;
  }

  async createStudent({ id, email, password, name, role, branch, semester, specialization }) {
    const result = await pool.query(
      `INSERT INTO users (id, email, password, name, role, branch, semester, specialization, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING id, email, name, role, branch, semester, email_verified`,
      [id, email, password, name, role, branch || null, semester || null, specialization || null]
    );
    return result.rows[0];
  }

  async createContentManager({ id, email, password, name, role }) {
    const result = await pool.query(
      `INSERT INTO content_managers (id, email, password, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role`,
      [id, email, password, name, role]
    );
    return result.rows[0];
  }

  async createAdmin({ id, email, password, name, role }) {
    const result = await pool.query(
      `INSERT INTO admin_users (id, email, password, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role`,
      [id, email, password, name, role]
    );
    return result.rows[0];
  }

  async createGoogleStudent({ id, email, name, googleId, picture }) {
    const result = await pool.query(
      `INSERT INTO users (id, email, name, role, google_id, auth_provider, profile_picture)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, email, name, "student", googleId, "google", picture || null]
    );
    return result.rows[0];
  }

  async linkGoogleAccount(userId, googleId, picture) {
    await pool.query(
      `UPDATE users SET google_id = $1, auth_provider = 'google', profile_picture = $2 WHERE id = $3`,
      [googleId, picture || null, userId]
    );
  }

  async updateUserDevices(userId, allowedDevices, deviceId) {
    await pool.query(
      `UPDATE users SET allowed_devices = $1, device_id = $2 WHERE id = $3`,
      [JSON.stringify(allowedDevices), deviceId, userId]
    );
  }

  async createDeviceRequest({ id, userId, userName, userEmail, deviceId, deviceName }) {
    await pool.query(
      `INSERT INTO device_requests (id, user_id, user_name, user_email, device_id, device_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [id, userId, userName, userEmail, deviceId, deviceName]
    );
  }

  async markEmailVerified(email) {
    await pool.query(
      `UPDATE users SET email_verified = TRUE, verified_at = CURRENT_TIMESTAMP WHERE email = $1`,
      [email]
    );
  }
}

module.exports = new AuthRepository();
