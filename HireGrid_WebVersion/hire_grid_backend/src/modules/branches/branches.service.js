const { pool } = require("../../database/connection");
const crypto = require("crypto");
const cacheService = require("../../services/cache.service");
const { ApiError } = require("../../utils/ApiError");

class BranchesService {
  async getBranches() {
    const result = await pool.query("SELECT * FROM branches ORDER BY name ASC");
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      status: row.status,
      isGeneral: row.is_general,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getActiveBranches() {
    const result = await pool.query("SELECT * FROM branches WHERE status = 'ACTIVE' ORDER BY name ASC");
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      status: row.status,
      isGeneral: row.is_general
    }));
  }

  async saveBranch(body, userId) {
    const { id, name, code, description, status, isGeneral } = body;
    const branchId = id || crypto.randomUUID();

    if (isGeneral) {
      await pool.query("UPDATE branches SET is_general = FALSE WHERE is_general = TRUE");
    }

    const check = await pool.query("SELECT id FROM branches WHERE id = $1", [branchId]);
    if (check.rows.length > 0) {
      await pool.query(
        `UPDATE branches 
         SET name = $1, code = $2, description = $3, status = $4, is_general = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [name, code, description, status || "ACTIVE", !!isGeneral, branchId]
      );
    } else {
      await pool.query(
        `INSERT INTO branches (id, name, code, description, status, is_general, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [branchId, name, code, description, status || "ACTIVE", !!isGeneral, userId || "system"]
      );
    }

    cacheService.clear();
    return { id: branchId };
  }

  async deleteBranch(id) {
    const check = await pool.query("SELECT is_general FROM branches WHERE id = $1", [id]);
    if (check.rows.length > 0 && check.rows[0].is_general) {
      throw new ApiError(400, "Cannot delete the default General branch fallback.");
    }

    await pool.query("DELETE FROM branches WHERE id = $1", [id]);
    cacheService.clear();
    return { success: true };
  }

  async getCompanyBranches(companyId) {
    const result = await pool.query(
      `SELECT * FROM company_branch_mappings WHERE company_id = $1`,
      [companyId]
    );
    return result.rows.map(row => ({
      id: row.id,
      companyId: row.company_id,
      branchId: row.branch_id,
      assignmentScope: row.assignment_scope
    }));
  }

  async saveCompanyBranches(companyId, assignmentScope, branchIds, user) {
    const userId = user ? user.id : "system";
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM company_branch_mappings WHERE company_id = $1", [companyId]);

      if (assignmentScope === "ALL") {
        const id = crypto.randomUUID();
        await client.query(
          `INSERT INTO company_branch_mappings (id, company_id, branch_id, assignment_scope, created_by)
           VALUES ($1, $2, NULL, 'ALL', $3)`,
          [id, companyId, userId]
        );
      } else if (Array.isArray(branchIds)) {
        for (const branchId of branchIds) {
          const id = crypto.randomUUID();
          await client.query(
            `INSERT INTO company_branch_mappings (id, company_id, branch_id, assignment_scope, created_by)
             VALUES ($1, $2, $3, 'SPECIFIC', $4)`,
            [id, companyId, branchId, userId]
          );
        }
      }

      await client.query("COMMIT");
      client.release();

      await pool.query(
        `INSERT INTO security_logs (id, user_id, user_name, user_email, event_type, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          user ? user.id : null,
          user ? user.name || "Content Manager" : "System",
          user ? user.email : null,
          "CONTENT_ACCESS_UPDATED",
          `Updated company access mappings for company ID '${companyId}'. Scope: ${assignmentScope}.`
        ]
      ).catch(e => console.error("Mapping audit log error:", e));

      cacheService.clear();
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      throw err;
    }
  }

  async saveCompanyBranchesBatch(companyIds, assignmentScope, branchIds, user) {
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      throw new ApiError(400, "companyIds array is required.");
    }

    const userId = user ? user.id : "system";
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM company_branch_mappings WHERE company_id = ANY($1)", [companyIds]);

      if (assignmentScope === "ALL") {
        const values = [];
        const valueStrings = [];
        let paramIndex = 1;

        companyIds.forEach(companyId => {
          valueStrings.push(`($${paramIndex++}, $${paramIndex++}, NULL, 'ALL', $${paramIndex++})`);
          values.push(crypto.randomUUID(), companyId, userId);
        });

        if (values.length > 0) {
          await client.query(
            `INSERT INTO company_branch_mappings (id, company_id, branch_id, assignment_scope, created_by)
             VALUES ${valueStrings.join(", ")}
             ON CONFLICT DO NOTHING`,
            values
          );
        }
      } else if (Array.isArray(branchIds) && branchIds.length > 0) {
        const values = [];
        const valueStrings = [];
        let paramIndex = 1;

        companyIds.forEach(companyId => {
          branchIds.forEach(branchId => {
            valueStrings.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 'SPECIFIC', $${paramIndex++})`);
            values.push(crypto.randomUUID(), companyId, branchId, userId);
          });
        });

        if (values.length > 0) {
          await client.query(
            `INSERT INTO company_branch_mappings (id, company_id, branch_id, assignment_scope, created_by)
             VALUES ${valueStrings.join(", ")}
             ON CONFLICT DO NOTHING`,
            values
          );
        }
      }

      await client.query("COMMIT");
      client.release();

      await pool.query(
        `INSERT INTO security_logs (id, user_id, user_name, user_email, event_type, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          user ? user.id : null,
          user ? user.name || "Content Manager" : "System",
          user ? user.email : null,
          "CONTENT_ACCESS_ASSIGNED",
          `Batch updated company access mappings for ${companyIds.length} companies. Scope: ${assignmentScope}.`
        ]
      ).catch(e => console.error("Mapping audit log error:", e));

      cacheService.clear();
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      throw err;
    }
  }

  async getContentMappings(contentType, contentId) {
    const result = await pool.query(
      `SELECT * FROM content_branch_mappings WHERE content_type = $1 AND content_id = $2`,
      [contentType, contentId]
    );
    return result.rows.map(row => ({
      id: row.id,
      contentId: row.content_id,
      contentType: row.content_type,
      branchId: row.branch_id,
      assignmentScope: row.assignment_scope
    }));
  }

  async saveContentMappings(contentType, contentId, assignmentScope, branchIds, user) {
    const userId = user ? user.id : "system";
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "DELETE FROM content_branch_mappings WHERE content_type = $1 AND content_id = $2",
        [contentType, contentId]
      );

      if (assignmentScope === "ALL") {
        const id = crypto.randomUUID();
        await client.query(
          `INSERT INTO content_branch_mappings (id, content_id, content_type, branch_id, assignment_scope, created_by)
           VALUES ($1, $2, $3, NULL, 'ALL', $4)`,
          [id, contentId, contentType, userId]
        );
      } else if (Array.isArray(branchIds)) {
        for (const branchId of branchIds) {
          const id = crypto.randomUUID();
          await client.query(
            `INSERT INTO content_branch_mappings (id, content_id, content_type, branch_id, assignment_scope, created_by)
             VALUES ($1, $2, $3, $4, 'SPECIFIC', $5)`,
            [id, contentId, contentType, branchId, userId]
          );
        }
      }

      await client.query("COMMIT");
      client.release();

      await pool.query(
        `INSERT INTO security_logs (id, user_id, user_name, user_email, event_type, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          user ? user.id : null,
          user ? user.name || "Content Manager" : "System",
          user ? user.email : null,
          "CONTENT_ACCESS_UPDATED",
          `Updated content access mappings for '${contentType}' ID '${contentId}'. Scope: ${assignmentScope}.`
        ]
      ).catch(e => console.error("Mapping audit log error:", e));

      cacheService.clear();
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      throw err;
    }
  }

  async saveContentMappingsBatch(contentType, contentIds, assignmentScope, branchIds, user) {
    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      throw new ApiError(400, "contentIds array is required.");
    }

    const userId = user ? user.id : "system";
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "DELETE FROM content_branch_mappings WHERE content_type = $1 AND content_id = ANY($2)",
        [contentType, contentIds]
      );

      if (assignmentScope === "ALL") {
        const values = [];
        const valueStrings = [];
        let paramIndex = 1;

        contentIds.forEach(contentId => {
          valueStrings.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, NULL, 'ALL', $${paramIndex++})`);
          values.push(crypto.randomUUID(), contentId, contentType, userId);
        });

        if (values.length > 0) {
          await client.query(
            `INSERT INTO content_branch_mappings (id, content_id, content_type, branch_id, assignment_scope, created_by)
             VALUES ${valueStrings.join(", ")}
             ON CONFLICT DO NOTHING`,
            values
          );
        }
      } else if (Array.isArray(branchIds) && branchIds.length > 0) {
        const values = [];
        const valueStrings = [];
        let paramIndex = 1;

        contentIds.forEach(contentId => {
          branchIds.forEach(branchId => {
            valueStrings.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 'SPECIFIC', $${paramIndex++})`);
            values.push(crypto.randomUUID(), contentId, contentType, branchId, userId);
          });
        });

        if (values.length > 0) {
          await client.query(
            `INSERT INTO content_branch_mappings (id, content_id, content_type, branch_id, assignment_scope, created_by)
             VALUES ${valueStrings.join(", ")}
             ON CONFLICT DO NOTHING`,
            values
          );
        }
      }

      await client.query("COMMIT");
      client.release();

      await pool.query(
        `INSERT INTO security_logs (id, user_id, user_name, user_email, event_type, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          user ? user.id : null,
          user ? user.name || "Content Manager" : "System",
          user ? user.email : null,
          "CONTENT_ACCESS_ASSIGNED",
          `Batch updated content access mappings for ${contentIds.length} '${contentType}' items. Scope: ${assignmentScope}.`
        ]
      ).catch(e => console.error("Mapping audit log error:", e));

      cacheService.clear();
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      throw err;
    }
  }
}

module.exports = new BranchesService();
