const { pool } = require("../../database/connection");
const crypto = require("crypto");
const { applyQueryModifiers } = require("../../utils/queryBuilder");
const { dbCache } = require("../../services/accessChecker.service");
const cacheService = require("../../services/cache.service");
const { ApiError } = require("../../utils/ApiError");

class PlansService {
  async getPlans(query) {
    const cacheKey = `plans:query:${JSON.stringify(query)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const baseQuery = `
      SELECT 
        id, 
        name, 
        price, 
        duration, 
        duration_days AS "durationDays", 
        is_active AS "isActive", 
        is_freemium AS "isFreemium", 
        learning_content AS "learningContent", 
        company_modules AS "companyModules", 
        free_demo_modules AS "freeDemoModules", 
        upi_id AS "upiId",
        contact_number AS "contactNumber",
        qr_code AS "qrCode",
        payment_number AS "paymentNumber",
        created_at AS "createdAt",
        active_from AS "activeFrom",
        active_until AS "activeUntil"
      FROM plans
    `;
    const { sql, values } = applyQueryModifiers(baseQuery, query, 'created_at DESC');
    const result = await pool.query(sql, values);
    const plansList = result.rows;

    if (plansList.length > 0) {
      const planIds = plansList.map(p => p.id);
      const mappingsResult = await pool.query(
        `SELECT plan_id AS "planId", company_id AS "companyId", branch_id AS "branchId" 
         FROM plan_mappings 
         WHERE plan_id = ANY($1)`,
        [planIds]
      );
      
      const mappingsGrouped = {};
      for (const m of mappingsResult.rows) {
        if (!mappingsGrouped[m.planId]) {
          mappingsGrouped[m.planId] = [];
        }
        mappingsGrouped[m.planId].push({ companyId: m.companyId, branchId: m.branchId });
      }
      
      for (const p of plansList) {
        p.companyBranches = mappingsGrouped[p.id] || [];
      }
    }

    cacheService.set(cacheKey, plansList, 300);
    return plansList;
  }

  async getPlanById(id) {
    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        price, 
        duration, 
        duration_days AS "durationDays", 
        is_active AS "isActive", 
        is_freemium AS "isFreemium", 
        learning_content AS "learningContent", 
        company_modules AS "companyModules", 
        free_demo_modules AS "freeDemoModules", 
        upi_id AS "upiId",
        contact_number AS "contactNumber",
        qr_code AS "qrCode",
        payment_number AS "paymentNumber",
        created_at AS "createdAt",
        active_from AS "activeFrom",
        active_until AS "activeUntil"
       FROM plans WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Plan not found");
    }

    const plan = result.rows[0];
    const mappingsResult = await pool.query(
      `SELECT company_id AS "companyId", branch_id AS "branchId" 
       FROM plan_mappings 
       WHERE plan_id = $1`,
      [id]
    );
    plan.companyBranches = mappingsResult.rows;
    return plan;
  }

  async savePlan(body) {
    const {
      id,
      name,
      price,
      duration,
      durationDays,
      isActive,
      isFreemium,
      learningContent,
      companyModules,
      freeDemoModules,
      companyBranches,
      upiId,
      contactNumber,
      qrCode,
      paymentNumber,
      activeFrom,
      activeUntil,
    } = body;
    const planId = id || crypto.randomUUID();

    await pool.query("BEGIN");
    try {
      await pool.query(
        `INSERT INTO plans (
          id, name, price, duration, duration_days, is_active, is_freemium, learning_content, company_modules, free_demo_modules, upi_id, contact_number, qr_code, payment_number, active_from, active_until
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             price = EXCLUDED.price,
             duration = EXCLUDED.duration,
             duration_days = EXCLUDED.duration_days,
             is_active = EXCLUDED.is_active,
             is_freemium = EXCLUDED.is_freemium,
             learning_content = EXCLUDED.learning_content,
             company_modules = EXCLUDED.company_modules,
             free_demo_modules = EXCLUDED.free_demo_modules,
             upi_id = EXCLUDED.upi_id,
             contact_number = EXCLUDED.contact_number,
             qr_code = EXCLUDED.qr_code,
             payment_number = EXCLUDED.payment_number,
             active_from = EXCLUDED.active_from,
             active_until = EXCLUDED.active_until`,
        [
          planId,
          name,
          price,
          duration || 'free',
          durationDays !== undefined ? durationDays : null,
          isActive !== undefined ? isActive : true,
          isFreemium !== undefined ? isFreemium : false,
          JSON.stringify(learningContent || []),
          JSON.stringify(companyModules || []),
          JSON.stringify(freeDemoModules || []),
          upiId || null,
          contactNumber || null,
          qrCode || null,
          paymentNumber || null,
          activeFrom !== undefined && activeFrom !== null ? Number(activeFrom) : null,
          activeUntil !== undefined && activeUntil !== null ? Number(activeUntil) : null,
        ]
      );

      await pool.query("DELETE FROM plan_mappings WHERE plan_id = $1", [planId]);

      if (companyBranches && Array.isArray(companyBranches)) {
        for (const mapping of companyBranches) {
          const { companyId, branchId } = mapping;
          if (companyId && branchId) {
            const compCheck = await pool.query("SELECT 1 FROM companies WHERE id = $1", [companyId]);
            if (compCheck.rows.length === 0) {
              await pool.query("ROLLBACK");
              throw new ApiError(400, `Company with ID ${companyId} does not exist.`);
            }
            const branchCheck = await pool.query("SELECT 1 FROM hierarchy_nodes WHERE id = $1 AND type = 'general_branch'", [branchId]);
            if (branchCheck.rows.length === 0) {
              await pool.query("ROLLBACK");
              throw new ApiError(400, `Branch with ID ${branchId} does not exist.`);
            }

            const mappingId = crypto.randomUUID();
            await pool.query(
              `INSERT INTO plan_mappings (id, plan_id, company_id, branch_id)
               VALUES ($1, $2, $3, $4)`,
              [mappingId, planId, companyId, branchId]
            );
          }
        }
      }

      await pool.query("COMMIT");
      dbCache.clear();
      cacheService.invalidatePattern("plans");
      return { id: planId };
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
  }

  async deletePlan(id) {
    await pool.query("DELETE FROM plans WHERE id = $1", [id]);
    dbCache.clear();
    cacheService.invalidatePattern("plans");
    return { success: true };
  }

  async getPaymentRequests() {
    const result = await pool.query(`
      SELECT id, 
             user_id AS "userId", 
             user_name AS "userName", 
             user_email AS "userEmail", 
             transaction_id AS "transactionId", 
             item_name AS "itemName", 
             item_type AS "itemType", 
             item_id AS "itemId", 
             amount, 
             status, 
             duration, 
             created_at AS "createdAt" 
      FROM payment_requests 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async createPaymentRequest(body) {
    const { id, userId, userName, userEmail, transactionId, itemName, itemType, itemId, amount, status = "pending", duration } = body;
    const reqId = id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO payment_requests (
        id, user_id, user_name, user_email, transaction_id, item_name, item_type, item_id, amount, status, duration
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        reqId, 
        userId, 
        userName, 
        userEmail || null, 
        transactionId || null, 
        itemName || null, 
        itemType || "full_premium", 
        itemId || null, 
        amount || 0, 
        status, 
        duration || null
      ]
    );
    return { success: true };
  }

  async updatePaymentRequest(id, status) {
    await pool.query(
      `UPDATE payment_requests SET status = $1 WHERE id = $2`,
      [status, id]
    );
    return { success: true };
  }
}

module.exports = new PlansService();
