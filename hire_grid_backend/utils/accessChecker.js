const { pool } = require("../config/db");

// Simple In-Memory Cache with TTL
class MemoryCache {
  constructor() {
    this.cache = new Map();
  }
  set(key, value, ttlMs = 30000) {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }
  delete(key) {
    this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
}

const dbCache = new MemoryCache();

/**
 * Verify if a user has access to a specific item (company/module/exam) based on user state & active plan.
 * @param {string} userId - User's ID
 * @param {string} itemId - Item ID (module ID, company ID, etc.)
 * @param {string} itemType - 'module' | 'company' | 'exam'
 * @returns {Promise<{ allowed: boolean, reason?: string }>}
 */
async function verifyUserItemAccess(userId, itemId, itemType = "module") {
  if (!userId) {
    return { allowed: false, reason: "Authentication required." };
  }

  // 1. Check cached user role
  let role = dbCache.get(`role:${userId}`);
  if (!role) {
    const adminCheck = await pool.query(
      "SELECT role FROM admin_users WHERE id = $1 UNION SELECT role FROM content_managers WHERE id = $1",
      [userId]
    );
    role = adminCheck.rows.length > 0 ? adminCheck.rows[0].role : "student";
    dbCache.set(`role:${userId}`, role, 300000); // Cache role for 5 minutes
  }

  if (role === "admin" || role === "content_manager") {
    return { allowed: true };
  }

  // 2. Fetch User Record from cache or database
  let user = dbCache.get(`user:${userId}`);
  if (!user) {
    const userResult = await pool.query(
      `SELECT id, role, has_full_premium, active_plan_id, plan_expiry, 
              purchased_companies, granted_company_access, granted_subject_access, 
              granted_topic_access, granted_exam_access, granted_module_access 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return { allowed: false, reason: "User not found." };
    }
    user = userResult.rows[0];
    dbCache.set(`user:${userId}`, user, 5000); // Cache user for 5 seconds during rapid requests
  }

  // 3. Fetch Item Details from cache or database
  let item = null;
  if (itemType === "module") {
    item = dbCache.get(`module:${itemId}`);
    if (!item) {
      const modRes = await pool.query("SELECT * FROM modules WHERE id = $1", [itemId]);
      if (modRes.rows.length > 0) {
        item = modRes.rows[0];
        dbCache.set(`module:${itemId}`, item, 300000); // Cache for 5 minutes
      }
    }
  } else if (itemType === "company") {
    item = dbCache.get(`company:${itemId}`);
    if (!item) {
      const compRes = await pool.query("SELECT * FROM companies WHERE id = $1", [itemId]);
      if (compRes.rows.length > 0) {
        item = compRes.rows[0];
        dbCache.set(`company:${itemId}`, item, 300000); // Cache for 5 minutes
      }
    }
  }

  // If item doesn't exist in DB, handle appropriately
  if (!item && itemType === "module") {
    return { allowed: false, reason: "Module not found." };
  }

  // Intercept Draft status for students
  if (item && item.publication_status === 'DRAFT' && role !== "admin" && role !== "content_manager") {
    return { allowed: false, reason: "This content is currently in draft and is not visible to students." };
  }

  // 4. Check if Item is Free or Demo (and verify plan inclusions)
  if (item) {
    const accessMode = item.access_mode || "inherit";
    let accessType = "free";
    if (item.access_type && item.access_type !== "free") {
      accessType = item.access_type;
    } else if (item.is_premium) {
      accessType = "premium_only";
    }

    // Check if included in any plan
    let isIncludedInAnyPlan = dbCache.get(`includedInPlan:${itemType}:${item.id}`);
    if (isIncludedInAnyPlan === null || isIncludedInAnyPlan === undefined) {
      isIncludedInAnyPlan = false;
      if (itemType === "company") {
        const planCheck = await pool.query(
          `SELECT 1 FROM plan_mappings WHERE company_id = $1 
           UNION 
           SELECT 1 FROM plans WHERE company_modules @> $2::jsonb`,
          [item.id, JSON.stringify([item.id])]
        );
        if (planCheck.rows.length > 0) {
          isIncludedInAnyPlan = true;
        }
      } else if (itemType === "module") {
        if (item.module_type === "company" && item.parent_id) {
          const planCheckCompany = await pool.query(
            `SELECT 1 FROM plan_mappings WHERE company_id = $1 
             UNION 
             SELECT 1 FROM plans WHERE company_modules @> $2::jsonb`,
            [item.parent_id, JSON.stringify([item.parent_id])]
          );
          if (planCheckCompany.rows.length > 0) {
            isIncludedInAnyPlan = true;
          }
        } else {
          // Fetch ancestors
          let ancestorIds = dbCache.get(`ancestors:${item.parent_id}`);
          if (!ancestorIds) {
            const ancestorRes = await pool.query(
              `WITH RECURSIVE ancestors AS (
                 SELECT id, parent_id FROM hierarchy_nodes WHERE id = $1
                 UNION ALL
                 SELECT hn.id, hn.parent_id FROM hierarchy_nodes hn
                 INNER JOIN ancestors a ON a.parent_id = hn.id
               )
               SELECT id FROM ancestors`,
              [item.parent_id]
            );
            ancestorIds = [item.id, ...ancestorRes.rows.map((row) => row.id)];
            dbCache.set(`ancestors:${item.parent_id}`, ancestorIds, 600000); // Cache for 10 minutes
          }

          const planCheckAncestors = await pool.query(
            `SELECT 1 FROM plans p, jsonb_array_elements_text(p.learning_content) lc
             WHERE lc = ANY($1)`,
            [ancestorIds]
          );
          if (planCheckAncestors.rows.length > 0) {
            isIncludedInAnyPlan = true;
          }
        }
      }
      dbCache.set(`includedInPlan:${itemType}:${item.id}`, isIncludedInAnyPlan, 300000); // Cache for 5 minutes
    }

    if (isIncludedInAnyPlan) {
      accessType = "premium_only";
    }

    if (itemType === "module" && accessMode === "inherit" && item.parent_id) {
      let parentAccessType = dbCache.get(`parentAccessType:${item.parent_id}`);
      if (!parentAccessType) {
        const parentRes = await pool.query(
          "SELECT access_type, is_premium FROM companies WHERE id = $1 UNION SELECT access_type, is_premium FROM hierarchy_nodes WHERE id = $1",
          [item.parent_id]
        );
        if (parentRes.rows.length > 0) {
          const pRow = parentRes.rows[0];
          parentAccessType = (pRow.access_type && pRow.access_type !== "free")
            ? pRow.access_type
            : (pRow.is_premium ? "premium_only" : "free");
        } else {
          parentAccessType = "free";
        }
        dbCache.set(`parentAccessType:${item.parent_id}`, parentAccessType, 300000); // Cache for 5 minutes
      }

      if (parentAccessType !== "free" && parentAccessType !== "demo") {
        accessType = parentAccessType;
      }
    }

    if (accessType === "free" || accessType === "demo") {
      return { allowed: true };
    }
  }

  // 5. Check Explicit Admin Grants / Individual Purchases
  const parseObj = (val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return {};
  };

  const grantedCompanyAccess = parseObj(user.granted_company_access);
  const grantedModuleAccess = parseObj(user.granted_module_access);
  const purchasedCompanies = Array.isArray(user.purchased_companies)
    ? user.purchased_companies
    : typeof user.purchased_companies === "string"
    ? JSON.parse(user.purchased_companies || "[]")
    : [];

  if (itemType === "company" && (grantedCompanyAccess[itemId] !== undefined || purchasedCompanies.includes(itemId))) {
    const expiry = grantedCompanyAccess[itemId];
    if (expiry === undefined || expiry === null || Date.now() <= Number(expiry)) {
      return { allowed: true };
    }
  }

  if (itemType === "module") {
    if (grantedModuleAccess[itemId] !== undefined) {
      const expiry = grantedModuleAccess[itemId];
      if (expiry === null || expiry === undefined || Date.now() <= Number(expiry)) {
        return { allowed: true };
      }
    }
    if (item && item.parent_id && (grantedCompanyAccess[item.parent_id] !== undefined || purchasedCompanies.includes(item.parent_id))) {
      const expiry = grantedCompanyAccess[item.parent_id];
      if (expiry === undefined || expiry === null || Date.now() <= Number(expiry)) {
        return { allowed: true };
      }
    }
  }

  // 6. Check Global Full Premium
  if (user.has_full_premium) {
    if (!user.plan_expiry || Date.now() <= Number(user.plan_expiry)) {
      return { allowed: true };
    }
  }

  // 7. Check Active Plan
  if (user.active_plan_id) {
    const isNotExpired = !user.plan_expiry || Date.now() <= Number(user.plan_expiry);
    if (isNotExpired) {
      let plan = dbCache.get(`plan:${user.active_plan_id}`);
      if (!plan) {
        const planRes = await pool.query("SELECT * FROM plans WHERE id = $1", [user.active_plan_id]);
        if (planRes.rows.length > 0) {
          plan = planRes.rows[0];
          dbCache.set(`plan:${user.active_plan_id}`, plan, 300000); // Cache plan for 5 minutes
        }
      }

      if (plan) {
        const companyModules = Array.isArray(plan.company_modules)
          ? plan.company_modules
          : typeof plan.company_modules === "string"
          ? JSON.parse(plan.company_modules || "[]")
          : [];
        const learningContent = Array.isArray(plan.learning_content)
          ? plan.learning_content
          : typeof plan.learning_content === "string"
          ? JSON.parse(plan.learning_content || "[]")
          : [];
        const freeDemoModules = Array.isArray(plan.free_demo_modules)
          ? plan.free_demo_modules
          : typeof plan.free_demo_modules === "string"
          ? JSON.parse(plan.free_demo_modules || "[]")
          : [];

        if (itemType === "company" && companyModules.includes(itemId)) {
          return { allowed: true };
        }

        if (itemType === "module") {
          if (freeDemoModules.includes(itemId)) return { allowed: true };
          if (learningContent.includes(itemId)) return { allowed: true };
          if (item && item.parent_id && (companyModules.includes(item.parent_id) || learningContent.includes(item.parent_id))) {
            return { allowed: true };
          }
        }
      }
    }
  }

  return {
    allowed: false,
    reason: "This content is locked under your current plan. Upgrade or subscribe to unlock access.",
  };
}

module.exports = { verifyUserItemAccess, dbCache };
