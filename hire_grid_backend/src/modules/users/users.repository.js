const { pool } = require("../../database/connection");
const { dbCache } = require("../../services/accessChecker.service");
const { applyQueryModifiers } = require("../../utils/queryBuilder");
const crypto = require("crypto");

class UsersRepository {
  async getUsers(query) {
    const baseQuery = `
      SELECT id, name, email, role, branch, semester, xp, level, rank, specialization, 
             has_full_premium AS "hasFullPremium", device_id AS "deviceId", 
             max_devices AS "maxDevices", allowed_devices AS "allowedDevices",
             active_plan_id AS "activePlanId", plan_expiry AS "planExpiry", 
             purchased_companies AS "purchasedCompanies", branch_id AS "branchId" 
      FROM users
    `;
    const { sql, values } = applyQueryModifiers(baseQuery, query, 'created_at DESC');
    const result = await pool.query(sql, values);
    return result.rows;
  }

  async getUserById(id) {
    let result = await pool.query(
      `SELECT id, name, email, role, branch, semester, xp, level, rank, specialization, 
              has_full_premium AS "hasFullPremium", device_id AS "deviceId", 
              max_devices AS "maxDevices", allowed_devices AS "allowedDevices",
              active_plan_id AS "activePlanId", plan_expiry AS "planExpiry", 
              purchased_companies AS "purchasedCompanies",
              granted_company_access AS "grantedCompanyAccess",
              granted_subject_access AS "grantedSubjectAccess",
              granted_topic_access AS "grantedTopicAccess",
              granted_exam_access AS "grantedExamAccess",
              granted_module_access AS "grantedModuleAccess",
              module_scores AS "moduleScores",
              branch_id AS "branchId" 
       FROM users 
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT id, name, email, role FROM admin_users WHERE id = $1`,
        [id]
      );
    }
    return result.rows[0] || null;
  }

  async getRawUser(id) {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  async updateUserRecord(id, data) {
    await pool.query(
      `UPDATE users 
       SET name = $1, branch = $2, semester = $3, xp = $4, level = $5, rank = $6, 
           specialization = $7, has_full_premium = $8, device_id = $9, 
           max_devices = $10, allowed_devices = $11,
           active_plan_id = $12, plan_expiry = $13, purchased_companies = $14, 
           granted_company_access = $15, granted_subject_access = $16, 
           granted_topic_access = $17, granted_exam_access = $18, 
           granted_module_access = $19, theme = $20, branch_id = $21, updated_at = CURRENT_TIMESTAMP
       WHERE id = $22`,
      [
        data.name,
        data.branch,
        data.semester,
        Number(data.xp) || 0,
        Number(data.level) || 1,
        data.rank,
        data.specialization,
        data.hasFullPremium,
        data.deviceId,
        Number(data.maxDevices) || 1,
        JSON.stringify(data.allowedDevices),
        data.activePlanId,
        data.planExpiry,
        JSON.stringify(data.purchasedCompanies),
        JSON.stringify(data.grantedCompanyAccess),
        JSON.stringify(data.grantedSubjectAccess),
        JSON.stringify(data.grantedTopicAccess),
        JSON.stringify(data.grantedExamAccess),
        JSON.stringify(data.grantedModuleAccess),
        data.theme,
        data.branchId,
        id
      ]
    );
    dbCache.delete("user:" + id);
    dbCache.delete("role:" + id);
  }

  async deleteUser(id) {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    dbCache.delete("user:" + id);
    dbCache.delete("role:" + id);
  }

  async getDeviceRequests() {
    const result = await pool.query(`
      SELECT 
        id, 
        user_id AS "userId", 
        user_name AS "userName", 
        user_email AS "userEmail", 
        device_id AS "newDeviceId", 
        device_name AS "deviceName", 
        status, 
        created_at AS "createdAt" 
      FROM device_requests 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async createDeviceRequest({ id, userId, userName, userEmail, deviceId, deviceName, status = "pending" }) {
    await pool.query(
      `INSERT INTO device_requests (id, user_id, user_name, user_email, device_id, device_name, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id || crypto.randomUUID(), userId, userName || null, userEmail || null, deviceId || null, deviceName || null, status]
    );
  }

  async updateDeviceRequestStatus(id, status) {
    const reqRes = await pool.query("SELECT * FROM device_requests WHERE id = $1", [id]);
    if (reqRes.rows.length === 0) {
      return null;
    }
    const devReq = reqRes.rows[0];

    await pool.query("UPDATE device_requests SET status = $1 WHERE id = $2", [status, id]);

    if (status === "approved" && devReq.user_id) {
      const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [devReq.user_id]);
      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        let allowed = Array.isArray(user.allowed_devices)
          ? user.allowed_devices
          : typeof user.allowed_devices === "string"
          ? JSON.parse(user.allowed_devices || "[]")
          : [];

        if (devReq.device_id && !allowed.some((d) => d.id === devReq.device_id || d.deviceId === devReq.device_id)) {
          allowed.push({
            id: devReq.device_id,
            deviceId: devReq.device_id,
            name: devReq.device_name || "Approved Device",
            addedAt: Date.now(),
            lastLoginAt: Date.now(),
          });
        }

        const newMax = Math.max(Number(user.max_devices || 1) + 1, allowed.length);

        await pool.query(
          "UPDATE users SET max_devices = $1, allowed_devices = $2 WHERE id = $3",
          [newMax, JSON.stringify(allowed), devReq.user_id]
        );
      }
    }

    return devReq;
  }
}

module.exports = new UsersRepository();
