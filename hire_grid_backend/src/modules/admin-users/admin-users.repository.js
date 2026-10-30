const { pool } = require("../../database/connection");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { ApiError } = require("../../utils/ApiError");

class AdminUsersRepository {
  async getAdminUsers() {
    const admins = await pool.query("SELECT id, name, email, role, allowed_platforms AS \"allowedPlatforms\", created_at FROM admin_users ORDER BY created_at DESC");
    const managers = await pool.query("SELECT id, name, email, role, allowed_platforms AS \"allowedPlatforms\", created_at FROM content_managers ORDER BY created_at DESC");
    
    const combined = [...admins.rows, ...managers.rows];
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return combined;
  }

  async saveAdminUser({ id, name, email, password, role, allowedPlatforms, allowed_platforms }) {
    const rawAllowed = allowedPlatforms || allowed_platforms || "all";
    const adminId = id || crypto.randomUUID();
    const targetTable = role === "content_manager" ? "content_managers" : "admin_users";
    const alternativeTable = role === "content_manager" ? "admin_users" : "content_managers";
    
    await pool.query(`DELETE FROM ${alternativeTable} WHERE id = $1`, [adminId]);

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO ${targetTable} (id, name, email, password, role, allowed_platforms)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password, role = EXCLUDED.role, allowed_platforms = EXCLUDED.allowed_platforms`,
        [adminId, name, email, hashedPassword, role || "content_manager", rawAllowed]
      );
    } else {
      await pool.query(
        `INSERT INTO ${targetTable} (id, name, email, role, allowed_platforms)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role, allowed_platforms = EXCLUDED.allowed_platforms`,
        [adminId, name, email, role || "content_manager", rawAllowed]
      );
    }
  }

  async updateAdminUser(id, { name, email, password, role, allowedPlatforms, allowed_platforms }) {
    const targetAllowed = allowedPlatforms !== undefined ? allowedPlatforms : (allowed_platforms !== undefined ? allowed_platforms : undefined);
    let currentTable = "admin_users";
    let currentUserResult = await pool.query("SELECT * FROM admin_users WHERE id = $1", [id]);
    if (currentUserResult.rows.length === 0) {
      currentUserResult = await pool.query("SELECT * FROM content_managers WHERE id = $1", [id]);
      if (currentUserResult.rows.length === 0) {
        throw new ApiError(404, "User not found.");
      }
      currentTable = "content_managers";
    }

    const currentUser = currentUserResult.rows[0];
    const targetRole = role !== undefined ? role : currentUser.role;
    const targetTable = targetRole === "content_manager" ? "content_managers" : "admin_users";

    let hashedPassword = currentUser.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = {
      id,
      name: name !== undefined ? name : currentUser.name,
      email: email !== undefined ? email.trim() : currentUser.email,
      password: hashedPassword,
      role: targetRole,
    };

    if (currentTable !== targetTable) {
      await pool.query(`DELETE FROM ${currentTable} WHERE id = $1`, [id]);
      await pool.query(
        `INSERT INTO ${targetTable} (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)`,
        [updatedUser.id, updatedUser.name, updatedUser.email, updatedUser.password, updatedUser.role]
      );
    } else {
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      if (name !== undefined) {
        setClauses.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (email !== undefined) {
        setClauses.push(`email = $${paramIndex++}`);
        values.push(email.trim());
      }
      if (role !== undefined) {
        setClauses.push(`role = $${paramIndex++}`);
        values.push(role);
      }
      if (password) {
        setClauses.push(`password = ${paramIndex++}`);
        values.push(hashedPassword);
      }
      if (targetAllowed !== undefined) {
        setClauses.push(`allowed_platforms = ${paramIndex++}`);
        values.push(targetAllowed);
      }

      if (setClauses.length > 0) {
        values.push(id);
        await pool.query(
          `UPDATE ${currentTable} SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`,
          values
        );
      }
    }
  }

  async deleteAdminUser(id) {
    await pool.query("DELETE FROM admin_users WHERE id = $1", [id]);
    await pool.query("DELETE FROM content_managers WHERE id = $1", [id]);
  }
}

module.exports = new AdminUsersRepository();
