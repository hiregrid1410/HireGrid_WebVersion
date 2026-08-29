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

const verifyBranchAccess = async (userId, itemId, itemType) => {
  try {
    // 1. Get user's branch_id (or fallback to General)
    const userRes = await pool.query("SELECT branch_id FROM users WHERE id = $1", [userId]);
    let branchId = userRes.rows.length > 0 ? userRes.rows[0].branch_id : null;
    if (!branchId) {
      const generalRes = await pool.query("SELECT id FROM branches WHERE is_general = TRUE LIMIT 1");
      if (generalRes.rows.length > 0) branchId = generalRes.rows[0].id;
    }
    if (!branchId) return true; // Safe fallback if no branches exist in DB yet

    if (itemType === "company") {
      const mappingRes = await pool.query(
        `SELECT 1 FROM company_branch_mappings 
         WHERE company_id = $1 
           AND (assignment_scope = 'ALL' OR branch_id = $2)`,
        [itemId, branchId]
      );
      return mappingRes.rows.length > 0;
    } else if (itemType === "module") {
      const modRes = await pool.query("SELECT module_type, parent_id, id FROM modules WHERE id = $1", [itemId]);
      if (modRes.rows.length === 0) return false;
      const mod = modRes.rows[0];
      if (mod.module_type === "company" && mod.parent_id) {
        // Inherit from company
        const mappingRes = await pool.query(
          `SELECT 1 FROM company_branch_mappings 
           WHERE company_id = $1 
             AND (assignment_scope = 'ALL' OR branch_id = $2)`,
          [mod.parent_id, branchId]
        );
        return mappingRes.rows.length > 0;
      } else {
        // Independent content: check content_branch_mappings
        const mappingRes = await pool.query(
          `SELECT 1 FROM content_branch_mappings 
           WHERE content_id = $1 AND content_type = 'module'
             AND (assignment_scope = 'ALL' OR branch_id = $2)`,
          [mod.id, branchId]
        );
        return mappingRes.rows.length > 0;
      }
    } else if (itemType === "hierarchy_node" || itemType === "exam") {
      const mappingRes = await pool.query(
        `SELECT 1 FROM content_branch_mappings 
         WHERE content_id = $1 AND content_type = 'hierarchy_node'
           AND (assignment_scope = 'ALL' OR branch_id = $2)`,
        [itemId, branchId]
      );
      return mappingRes.rows.length > 0;
    }
  } catch (err) {
    console.error("verifyBranchAccess error:", err.message);
  }
  return true; // Default allow in case of errors to prevent breaking app
};

const normalizeItemType = (type) => {
  if (!type) return "module";
  const t = type.toLowerCase();
  if (t.includes("subject")) return "general_subject";
  if (t.includes("topic")) return "general_topic";
  if (t.includes("branch")) return "general_branch";
  return t;
};

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

const parseArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

const fetchHierarchyAncestors = async (nodeId, ancestorsList) => {
  try {
    const res = await pool.query(
      `WITH RECURSIVE ancestors AS (
         SELECT id, parent_id, type FROM hierarchy_nodes WHERE id = $1
         UNION ALL
         SELECT hn.id, hn.parent_id, hn.type FROM hierarchy_nodes hn
         INNER JOIN ancestors a ON a.parent_id = hn.id
       )
       SELECT id, type FROM ancestors`,
      [nodeId]
    );
    res.rows.forEach((row) => {
      if (row.id !== nodeId) {
        ancestorsList.push({ id: row.id, type: normalizeItemType(row.type) });
      }
    });
  } catch (err) {
    console.error("fetchHierarchyAncestors error:", err.message);
  }
};

const getAncestors = async (itemId, itemType) => {
  const ancestors = [];
  
  if (itemType === "module") {
    const modRes = await pool.query("SELECT id, module_type, parent_id FROM modules WHERE id = $1", [itemId]);
    if (modRes.rows.length === 0) return ancestors;
    const mod = modRes.rows[0];
    
    if (mod.module_type === "company" && mod.parent_id) {
      ancestors.push({ id: mod.parent_id, type: "company" });
    } else if (mod.parent_id) {
      const parentNodeRes = await pool.query("SELECT type FROM hierarchy_nodes WHERE id = $1", [mod.parent_id]);
      const parentType = parentNodeRes.rows.length > 0 ? normalizeItemType(parentNodeRes.rows[0].type) : "hierarchy_node";
      ancestors.push({ id: mod.parent_id, type: parentType });
      await fetchHierarchyAncestors(mod.parent_id, ancestors);
    }
  } else if (["general_branch", "general_subject", "general_topic", "hierarchy_node"].includes(itemType)) {
    await fetchHierarchyAncestors(itemId, ancestors);
  }
  return ancestors;
};

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

  // Verify branch access first for students
  const hasBranchAccess = await verifyBranchAccess(userId, itemId, itemType);
  if (!hasBranchAccess) {
    return { allowed: false, reason: "This content is not available for your branch." };
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
    dbCache.set(`user:${userId}`, user, 5000); // Cache user for 5 seconds
  }

  // 3. Fetch Item Details from cache or database
  let item = null;
  const normType = normalizeItemType(itemType);

  if (normType === "module") {
    item = dbCache.get(`module:${itemId}`);
    if (!item) {
      const modRes = await pool.query("SELECT * FROM modules WHERE id = $1", [itemId]);
      if (modRes.rows.length > 0) {
        item = modRes.rows[0];
        dbCache.set(`module:${itemId}`, item, 300000);
      }
    }
  } else if (normType === "company") {
    item = dbCache.get(`company:${itemId}`);
    if (!item) {
      const compRes = await pool.query("SELECT * FROM companies WHERE id = $1", [itemId]);
      if (compRes.rows.length > 0) {
        item = compRes.rows[0];
        dbCache.set(`company:${itemId}`, item, 300000);
      }
    }
  } else if (["general_branch", "general_subject", "general_topic"].includes(normType)) {
    item = dbCache.get(`node:${itemId}`);
    if (!item) {
      const nodeRes = await pool.query("SELECT * FROM hierarchy_nodes WHERE id = $1", [itemId]);
      if (nodeRes.rows.length > 0) {
        item = nodeRes.rows[0];
        dbCache.set(`node:${itemId}`, item, 300000);
      }
    }
  }

  // If item doesn't exist in DB, handle appropriately
  if (!item && normType === "module") {
    return { allowed: false, reason: "Module not found." };
  }

  // Intercept Draft status for students
  if (item && item.publication_status === 'DRAFT' && role !== "admin" && role !== "content_manager") {
    return { allowed: false, reason: "This content is currently in draft and is not visible to students." };
  }

  // Resolve Ancestors Path
  const ancestors = await getAncestors(itemId, normType);

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
    let isIncludedInAnyPlan = dbCache.get(`includedInPlan:${normType}:${item.id}`);
    if (isIncludedInAnyPlan === null || isIncludedInAnyPlan === undefined) {
      isIncludedInAnyPlan = false;
      const allResourceIds = [item.id, ...ancestors.map(a => a.id)];

      if (normType === "company") {
        const planCheck = await pool.query(
          `SELECT 1 FROM plan_mappings WHERE company_id = $1 
           UNION 
           SELECT 1 FROM plans WHERE company_modules @> $2::jsonb`,
          [item.id, JSON.stringify([item.id])]
        );
        if (planCheck.rows.length > 0) {
          isIncludedInAnyPlan = true;
        }
      } else if (normType === "module") {
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
          const planCheckAncestors = await pool.query(
            `SELECT 1 FROM plans p, jsonb_array_elements_text(p.learning_content) lc
             WHERE lc = ANY($1)`,
            [allResourceIds]
          );
          if (planCheckAncestors.rows.length > 0) {
            isIncludedInAnyPlan = true;
          }
        }
      } else if (["general_branch", "general_subject", "general_topic"].includes(normType)) {
        const planCheckAncestors = await pool.query(
          `SELECT 1 FROM plans p, jsonb_array_elements_text(p.learning_content) lc
           WHERE lc = ANY($1)`,
          [allResourceIds]
        );
        if (planCheckAncestors.rows.length > 0) {
          isIncludedInAnyPlan = true;
        }
      }
      dbCache.set(`includedInPlan:${normType}:${item.id}`, isIncludedInAnyPlan, 300000);
    }

    if (isIncludedInAnyPlan) {
      accessType = "premium_only";
    }

    if (normType === "module" && accessMode === "inherit" && item.parent_id) {
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
        dbCache.set(`parentAccessType:${item.parent_id}`, parentAccessType, 300000);
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
  const grantedCompanyAccess = parseObj(user.granted_company_access);
  const grantedSubjectAccess = parseObj(user.granted_subject_access);
  const grantedTopicAccess = parseObj(user.granted_topic_access);
  const grantedExamAccess = parseObj(user.granted_exam_access);
  const grantedModuleAccess = parseObj(user.granted_module_access);

  const purchasedCompanies = parseArray(user.purchased_companies);

  // Form a flat list of resources to verify grants against
  const resourcesToCheck = [{ id: itemId, type: normType }, ...ancestors];

  for (const resource of resourcesToCheck) {
    const resId = resource.id;
    const resType = resource.type;

    let accessMap = {};
    if (resType === "company") accessMap = grantedCompanyAccess;
    else if (resType === "general_subject") accessMap = grantedSubjectAccess;
    else if (resType === "general_topic") accessMap = grantedTopicAccess;
    else if (resType === "general_branch") accessMap = grantedExamAccess;
    else if (resType === "module") accessMap = grantedModuleAccess;

    if (accessMap[resId] !== undefined) {
      const expiry = accessMap[resId];
      if (expiry === undefined || expiry === null || Date.now() <= Number(expiry)) {
        return { allowed: true };
      }
    }

    if (resType === "company" && purchasedCompanies.includes(resId)) {
      return { allowed: true };
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
          dbCache.set(`plan:${user.active_plan_id}`, plan, 300000);
        }
      }

      if (plan) {
        const companyModules = parseArray(plan.company_modules);
        const learningContent = parseArray(plan.learning_content);
        const freeDemoModules = parseArray(plan.free_demo_modules);

        for (const resource of resourcesToCheck) {
          const resId = resource.id;
          const resType = resource.type;

          if (resType === "company") {
            if (companyModules.includes(resId) || learningContent.includes(resId)) return { allowed: true };
          } else if (resType === "module") {
            if (freeDemoModules.includes(resId)) return { allowed: true };
            if (learningContent.includes(resId)) return { allowed: true };
          } else if (["general_branch", "general_subject", "general_topic"].includes(resType)) {
            if (learningContent.includes(resId)) return { allowed: true };
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
