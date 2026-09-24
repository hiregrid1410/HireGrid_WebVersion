const { pool } = require("../../database/connection");
const crypto = require("crypto");
const { applyQueryModifiers } = require("../../utils/queryBuilder");

class MiscService {
  async getSettings(id) {
    const result = await pool.query(
      `SELECT id, 
              contact_number AS "contactNumber", 
              whatsapp_number AS "whatsappNumber", 
              upi_id AS "upiId", 
              bank_details AS "bankDetails", 
              instructions,
              qr_code AS "qrCode",
              payment_number AS "paymentNumber"
       FROM settings 
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return {};
    }
    return result.rows[0];
  }

  async saveSettings(id, body) {
    const { contactNumber, whatsappNumber, upiId, bankDetails, instructions, qrCode, paymentNumber } = body;
    await pool.query(
      `INSERT INTO settings (id, contact_number, whatsapp_number, upi_id, bank_details, instructions, qr_code, payment_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE
       SET contact_number = EXCLUDED.contact_number, whatsapp_number = EXCLUDED.whatsapp_number,
           upi_id = EXCLUDED.upi_id, bank_details = EXCLUDED.bank_details, instructions = EXCLUDED.instructions,
           qr_code = EXCLUDED.qr_code, payment_number = EXCLUDED.payment_number`,
      [
        id, 
        contactNumber || null, 
        whatsappNumber || null, 
        upiId || null, 
        bankDetails || null, 
        instructions || null, 
        qrCode || null, 
        paymentNumber || null
      ]
    );
    return { success: true };
  }

  async getStats() {
    const [totalStudentsRes, result] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      pool.query(`
        SELECT m.title AS "moduleName", COALESCE(ROUND(AVG(s.score)), 0) AS "avgScore"
        FROM modules m
        LEFT JOIN first_attempts s ON s.module_id = m.id
        GROUP BY m.id, m.title
      `),
    ]);
    const totalStudents = parseInt(totalStudentsRes.rows[0].count, 10);
    const chartData = result.rows.map(row => ({
      moduleName: row.moduleName,
      avgScore: parseInt(row.avgScore, 10)
    }));

    return { totalStudents, chartData };
  }

  async logSecurityEvent(user, { eventType, details }) {
    const userId = user ? user.id : null;
    const userEmail = user ? user.email : null;

    let userName = "Unknown Student";
    if (userId) {
      const userRes = await pool.query(
        "SELECT name FROM users WHERE id = $1 UNION SELECT name FROM admin_users WHERE id = $1 UNION SELECT name FROM content_managers WHERE id = $1",
        [userId]
      );
      if (userRes.rows.length > 0) {
        userName = userRes.rows[0].name;
      }
    }

    const logId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO security_logs (id, user_id, user_name, user_email, event_type, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [logId, userId, userName, userEmail, eventType, details || ""]
    );
    return { success: true };
  }

  async getSecurityLogs(user) {
    const userId = user ? user.id : null;
    const adminCheck = await pool.query(
      "SELECT id FROM admin_users WHERE id = $1 UNION SELECT id FROM content_managers WHERE id = $1",
      [userId]
    );
    if (adminCheck.rows.length === 0) {
      throw new Error("Unauthorized access to security logs.");
    }

    const result = await pool.query("SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 150");
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      eventType: row.event_type,
      details: row.details,
      createdAt: row.created_at
    }));
  }

  async getFeedbacks(query) {
    const baseQuery = `
      SELECT 
        id, 
        user_id AS "userId", 
        user_name AS "userName", 
        user_email AS "userEmail", 
        feedback_type AS "feedbackType", 
        message, 
        created_at AS "createdAt"
      FROM feedbacks
    `;
    const { sql, values } = applyQueryModifiers(baseQuery, query, 'created_at DESC');
    const result = await pool.query(sql, values);
    return result.rows;
  }

  async createFeedback(body) {
    const { id, userId, userName, userEmail, feedbackType, message } = body;
    const feedbackId = id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO feedbacks (id, user_id, user_name, user_email, feedback_type, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [feedbackId, userId, userName, userEmail, feedbackType, message]
    );
    return { success: true };
  }

  async deleteFeedback(id) {
    await pool.query("DELETE FROM feedbacks WHERE id = $1", [id]);
    return { success: true };
  }

  async getAccessRequests() {
    const result = await pool.query("SELECT * FROM access_requests ORDER BY created_at DESC");
    return result.rows;
  }

  async createAccessRequest(body) {
    const { id, userId, status = "pending" } = body;
    const reqId = id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO access_requests (id, user_id, status) VALUES ($1, $2, $3)`,
      [reqId, userId, status]
    );
    return { success: true };
  }

  async getPurchases(query = {}) {
    const limit = Math.min(Math.max(1, parseInt(query.limit, 10) || 50), 200);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const offset = (page - 1) * limit;

    const result = await pool.query(
      "SELECT * FROM purchases ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    return result.rows;
  }

  async getAuditLogs(query = {}) {
    const limit = Math.min(Math.max(1, parseInt(query.limit, 10) || 100), 500);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, user_id AS "userId", user_name AS "userName", user_email AS "userEmail",
              event_type AS "eventType", details, created_at AS "createdAt"
       FROM security_logs 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }
}

module.exports = new MiscService();
