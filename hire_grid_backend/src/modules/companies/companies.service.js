const { pool } = require("../../database/connection");
const crypto = require("crypto");
const { applyQueryModifiers } = require("../../utils/queryBuilder");
const { getUserBranchId, dbCache } = require("../../services/accessChecker.service");
const cacheService = require("../../services/cache.service");
const { ApiError } = require("../../utils/ApiError");

class CompaniesService {
  async getCompanies(query, user) {
    let role = "student";
    let userBranchId = null;
    if (user) {
      role = user.role || "student";
      if (role !== "admin" && role !== "content_manager") {
        userBranchId = await getUserBranchId(user.id);
      }
    }

    const cacheKey = `companies:role:${role}:branch:${userBranchId}:query:${JSON.stringify(query)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    let filterClause = "";
    if (role !== "admin" && role !== "content_manager") {
      filterClause = " WHERE (publication_status = 'PUBLISHED' OR publication_status IS NULL)";
    }

    const baseQuery = `
      SELECT 
        id, 
        name, 
        description, 
        logo_url AS "logoUrl",
        access_type AS "accessType",
        is_premium AS "isPremium",
        price,
        sell_type AS "sellType",
        display_order AS "displayOrder",
        created_at AS "createdAt",
        created_by AS "createdBy",
        publication_status AS "publicationStatus"
      FROM companies
      ${filterClause}
    `;
    const { sql, values } = applyQueryModifiers(baseQuery, query, 'COALESCE(display_order, 999999) ASC, created_at ASC', userBranchId);
    const result = await pool.query(sql, values);
    
    cacheService.set(cacheKey, result.rows, 300);
    return result.rows;
  }

  async saveCompany(body) {
    const { id, name, description, logoUrl, accessType, isPremium, price, sellType, displayOrder, createdAt, createdBy, publicationStatus } = body;
    const compId = id || crypto.randomUUID();
    const targetDisplayOrder = displayOrder !== undefined && displayOrder !== null ? displayOrder : Math.floor(Date.now() / 1000);

    await pool.query(
      `INSERT INTO companies (
        id, name, description, logo_url, access_type, is_premium, price, sell_type, display_order, created_at, created_by, publication_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name, 
           description = EXCLUDED.description, 
           logo_url = EXCLUDED.logo_url,
           access_type = EXCLUDED.access_type,
           is_premium = EXCLUDED.is_premium,
           price = EXCLUDED.price,
           sell_type = EXCLUDED.sell_type,
           display_order = EXCLUDED.display_order,
           created_at = EXCLUDED.created_at,
           created_by = COALESCE(companies.created_by, EXCLUDED.created_by),
           publication_status = EXCLUDED.publication_status`,
      [
        compId, 
        name, 
        description || null, 
        logoUrl || null,
        accessType || 'free',
        isPremium !== undefined ? isPremium : false,
        price || 0,
        sellType || 'pack',
        targetDisplayOrder,
        createdAt || Date.now(),
        createdBy || null,
        publicationStatus || 'PUBLISHED'
      ]
    );
    dbCache.clear();
    cacheService.invalidatePattern("companies");
    return { success: true };
  }

  async deleteCompany(id) {
    await pool.query("DELETE FROM companies WHERE id = $1", [id]);
    dbCache.clear();
    cacheService.invalidatePattern("companies");
    return { success: true };
  }

  async getExams(user) {
    let role = "student";
    if (user) {
      role = user.role || "student";
    }

    let result;
    if (role === "admin" || role === "content_manager") {
      result = await pool.query("SELECT *, publication_status AS \"publicationStatus\" FROM exams ORDER BY created_at DESC");
    } else {
      result = await pool.query(
        "SELECT *, publication_status AS \"publicationStatus\" FROM exams WHERE publication_status = 'PUBLISHED' OR publication_status IS NULL ORDER BY created_at DESC"
      );
    }
    return result.rows;
  }

  async saveExam(body) {
    const { id, title, description, publicationStatus } = body;
    const examId = id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO exams (id, title, description, publication_status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
       SET title = EXCLUDED.title, 
           description = EXCLUDED.description,
           publication_status = EXCLUDED.publication_status`,
      [examId, title, description || null, publicationStatus || 'PUBLISHED']
    );
    return { success: true };
  }

  async deleteExam(id) {
    await pool.query("DELETE FROM exams WHERE id = $1", [id]);
    return { success: true };
  }

  async getHierarchyNodes(query, user) {
    let role = "student";
    let userBranchId = null;
    if (user) {
      role = user.role || "student";
      if (role !== "admin" && role !== "content_manager") {
        userBranchId = await getUserBranchId(user.id);
      }
    }

    const cacheKey = `hierarchy_nodes:role:${role}:branch:${userBranchId}:query:${JSON.stringify(query)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    let filterClause = "";
    if (role !== "admin" && role !== "content_manager") {
      filterClause = " WHERE (publication_status = 'PUBLISHED' OR publication_status IS NULL)";
    }

    const baseQuery = `
      SELECT 
        id, 
        name, 
        type, 
        parent_id AS "parentId",
        description,
        access_type AS "accessType",
        is_premium AS "isPremium",
        sell_type AS "sellType",
        display_order AS "displayOrder",
        created_at AS "createdAt",
        created_by AS "createdBy",
        publication_status AS "publicationStatus"
      FROM hierarchy_nodes
      ${filterClause}
    `;
    const { sql, values } = applyQueryModifiers(baseQuery, query, 'COALESCE(display_order, 999999) ASC, created_at ASC', userBranchId);
    const result = await pool.query(sql, values);
    
    cacheService.set(cacheKey, result.rows, 300);
    return result.rows;
  }

  async saveHierarchyNode(body) {
    const { id, name, type, parentId, description, accessType, isPremium, sellType, displayOrder, createdAt, createdBy, publicationStatus } = body;
    const nodeId = id || crypto.randomUUID();
    const targetDisplayOrder = displayOrder !== undefined && displayOrder !== null ? displayOrder : Math.floor(Date.now() / 1000);

    await pool.query(
      `INSERT INTO hierarchy_nodes (
        id, name, type, parent_id, description, access_type, is_premium, sell_type, display_order, created_at, created_by, publication_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name, 
           type = EXCLUDED.type, 
           parent_id = EXCLUDED.parent_id,
           description = EXCLUDED.description,
           access_type = EXCLUDED.access_type,
           is_premium = EXCLUDED.is_premium,
           sell_type = EXCLUDED.sell_type,
           display_order = EXCLUDED.display_order,
           created_at = EXCLUDED.created_at,
           created_by = COALESCE(hierarchy_nodes.created_by, EXCLUDED.created_by),
           publication_status = EXCLUDED.publication_status`,
      [
        nodeId, 
        name, 
        type, 
        parentId || null, 
        description || null, 
        accessType || 'free', 
        isPremium !== undefined ? isPremium : false, 
        sellType || 'pack', 
        targetDisplayOrder,
        createdAt || Date.now(),
        createdBy || null,
        publicationStatus || 'PUBLISHED'
      ]
    );
    cacheService.invalidatePattern("hierarchy_nodes");
    return { success: true };
  }

  async deleteHierarchyNode(id) {
    await pool.query("DELETE FROM hierarchy_nodes WHERE id = $1", [id]);
    cacheService.invalidatePattern("hierarchy_nodes");
    return { success: true };
  }
}

module.exports = new CompaniesService();
