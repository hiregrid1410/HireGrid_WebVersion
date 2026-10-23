const { pool } = require("../database/connection");
const ApiError = require("./ApiError");

/**
 * Whitelist of tables subject to platform-level filtering.
 * Strictly enforced per Amendment A3: Never apply platform filtering to any table outside this whitelist.
 */
const WHITELISTED_PLATFORM_TABLES = Object.freeze([
  "companies",
  "branches",
  "hierarchy_nodes",
  "modules",
  "plans",
  "revision_modules",
  "exams",
  "placement_mission_cycles",
]);

/**
 * Valid platform values
 */
const VALID_PLATFORMS = Object.freeze(["web", "app", "both"]);

function isValidPlatform(platform) {
  return typeof platform === "string" && VALID_PLATFORMS.includes(platform.toLowerCase());
}

/**
 * Generates parameterized SQL clause for platform filtering, including ancestor checks.
 * Returns null if table is not in the whitelist.
 */
function getPlatformSqlFilter(table, platform, paramIndex, tableAlias = null) {
  if (!WHITELISTED_PLATFORM_TABLES.includes(table)) {
    return null;
  }
  const targetPlatform = platform.toLowerCase();
  const alias = tableAlias || table;

  switch (table) {
    case "companies":
    case "branches":
    case "plans":
    case "exams":
    case "placement_mission_cycles":
      return {
        sql: `(${alias}.platform = 'both' OR ${alias}.platform = $${paramIndex})`,
        values: [targetPlatform],
      };

    case "revision_modules":
      return {
        sql: `(${alias}.platform = 'both' OR ${alias}.platform = $${paramIndex})`,
        values: [targetPlatform],
      };

    case "hierarchy_nodes":
      return {
        sql: `(
          (${alias}.platform = 'both' OR ${alias}.platform = $${paramIndex})
          AND NOT EXISTS (
            WITH RECURSIVE anc AS (
              SELECT id, parent_id, platform FROM hierarchy_nodes WHERE id = ${alias}.parent_id
              UNION ALL
              SELECT hn.id, hn.parent_id, hn.platform FROM hierarchy_nodes hn INNER JOIN anc ON anc.parent_id = hn.id
            )
            SELECT 1 FROM anc WHERE anc.platform != 'both' AND anc.platform != $${paramIndex}
          )
        )`,
        values: [targetPlatform],
      };

    case "modules":
      return {
        sql: `(
          (${alias}.platform = 'both' OR ${alias}.platform = $${paramIndex})
          AND (
            (${alias}.module_type = 'company' AND ${alias}.parent_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM companies c WHERE c.id = ${alias}.parent_id AND (c.platform = 'both' OR c.platform = $${paramIndex})
            ))
            OR
            (${alias}.module_type = 'exam' AND ${alias}.parent_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM exams e WHERE e.id = ${alias}.parent_id AND (e.platform = 'both' OR e.platform = $${paramIndex})
            ))
            OR
            (${alias}.parent_id IS NOT NULL AND ${alias}.module_type NOT IN ('company', 'exam') AND EXISTS (
              SELECT 1 FROM hierarchy_nodes hn WHERE hn.id = ${alias}.parent_id AND (hn.platform = 'both' OR hn.platform = $${paramIndex})
              AND NOT EXISTS (
                WITH RECURSIVE anc AS (
                  SELECT id, parent_id, platform FROM hierarchy_nodes WHERE id = hn.parent_id
                  UNION ALL
                  SELECT h.id, h.parent_id, h.platform FROM hierarchy_nodes h INNER JOIN anc ON anc.parent_id = h.id
                )
                SELECT 1 FROM anc WHERE anc.platform != 'both' AND anc.platform != $${paramIndex}
              )
            ))
            OR
            (${alias}.parent_id IS NULL)
          )
        )`,
        values: [targetPlatform],
      };

    default:
      return null;
  }
}

/**
 * Checks whether an item and its entire ancestor chain is accessible for a given platform.
 * Returns true if accessible, false if restricted, or null if item does not exist.
 */
async function checkItemPlatformAccess(table, itemId, platform, userRole = null, client = pool) {
  // A9: Admin and content_manager bypass platform checks completely
  if (userRole === "admin" || userRole === "content_manager") {
    return true;
  }

  if (!platform || !itemId || !WHITELISTED_PLATFORM_TABLES.includes(table)) {
    return true;
  }

  const targetPlatform = platform.toLowerCase();

  switch (table) {
    case "companies": {
      const res = await client.query("SELECT platform FROM companies WHERE id = $1", [itemId]);
      if (res.rows.length === 0) return null;
      const p = res.rows[0].platform;
      return p === "both" || p === targetPlatform;
    }

    case "branches": {
      const res = await client.query("SELECT platform FROM branches WHERE id = $1", [itemId]);
      if (res.rows.length === 0) return null;
      const p = res.rows[0].platform;
      return p === "both" || p === targetPlatform;
    }

    case "plans": {
      const res = await client.query("SELECT platform FROM plans WHERE id = $1", [itemId]);
      if (res.rows.length === 0) return null;
      const p = res.rows[0].platform;
      return p === "both" || p === targetPlatform;
    }

    case "revision_modules": {
      const res = await client.query("SELECT platform FROM revision_modules WHERE id = $1", [itemId]);
      if (res.rows.length === 0) return null;
      const p = res.rows[0].platform;
      return p === "both" || p === targetPlatform;
    }

    case "exams": {
      const res = await client.query("SELECT platform FROM exams WHERE id = $1", [itemId]);
      if (res.rows.length === 0) return null;
      const p = res.rows[0].platform;
      return p === "both" || p === targetPlatform;
    }

    case "placement_mission_cycles": {
      const res = await client.query("SELECT platform FROM placement_mission_cycles WHERE id = $1", [itemId]);
      if (res.rows.length === 0) return null;
      const p = res.rows[0].platform;
      return p === "both" || p === targetPlatform;
    }

    case "hierarchy_nodes": {
      const res = await client.query(
        `WITH RECURSIVE anc AS (
           SELECT id, parent_id, platform FROM hierarchy_nodes WHERE id = $1
           UNION ALL
           SELECT hn.id, hn.parent_id, hn.platform FROM hierarchy_nodes hn INNER JOIN anc ON anc.parent_id = hn.id
         )
         SELECT platform FROM anc`,
        [itemId]
      );
      if (res.rows.length === 0) return null;
      for (const row of res.rows) {
        if (row.platform !== "both" && row.platform !== targetPlatform) {
          return false;
        }
      }
      return true;
    }

    case "modules": {
      const modRes = await client.query(
        "SELECT id, module_type, parent_id, platform FROM modules WHERE id = $1",
        [itemId]
      );
      if (modRes.rows.length === 0) return null;
      const mod = modRes.rows[0];

      // 1. Module's own platform
      if (mod.platform !== "both" && mod.platform !== targetPlatform) {
        return false;
      }

      // 2. Ancestor platform
      if (mod.parent_id) {
        if (mod.module_type === "company") {
          const compRes = await client.query("SELECT platform FROM companies WHERE id = $1", [mod.parent_id]);
          if (compRes.rows.length > 0) {
            const cp = compRes.rows[0].platform;
            if (cp !== "both" && cp !== targetPlatform) return false;
          }
        } else if (mod.module_type === "exam") {
          const examRes = await client.query("SELECT platform FROM exams WHERE id = $1", [mod.parent_id]);
          if (examRes.rows.length > 0) {
            const ep = examRes.rows[0].platform;
            if (ep !== "both" && ep !== targetPlatform) return false;
          }
        } else {
          // Hierarchy node parent & ancestors
          const hnCheck = await checkItemPlatformAccess("hierarchy_nodes", mod.parent_id, targetPlatform, userRole, client);
          if (hnCheck === false) return false;
        }
      }
      return true;
    }

    default:
      return true;
  }
}

/**
 * Asserts platform access for a requested item.
 * If unauthorized or not found, throws ApiError 404 to avoid leaking item existence across platforms.
 */
async function assertItemPlatformAccess(table, itemId, platform, userRole = null, client = pool) {
  const isAccessible = await checkItemPlatformAccess(table, itemId, platform, userRole, client);
  if (isAccessible === false || isAccessible === null) {
    throw new ApiError(404, `${table.slice(0, -1)} not found.`);
  }
  return true;
}

module.exports = {
  WHITELISTED_PLATFORM_TABLES,
  VALID_PLATFORMS,
  isValidPlatform,
  getPlatformSqlFilter,
  checkItemPlatformAccess,
  assertItemPlatformAccess,
};
