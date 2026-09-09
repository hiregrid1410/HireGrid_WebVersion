const { pool } = require("../../database/connection");
const crypto = require("crypto");

class GateService {
  async getGateBranches() {
    const result = await pool.query("SELECT * FROM gate_branches");
    return result.rows;
  }

  async saveGateBranch(body) {
    const { id, name } = body;
    const branchId = id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO gate_branches (id, name)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [branchId, name]
    );
    return { success: true };
  }

  async getGatePapers() {
    const result = await pool.query("SELECT * FROM gate_papers");
    return result.rows;
  }

  async saveGatePaper(body) {
    const { id, title } = body;
    const paperId = id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO gate_papers (id, title)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`,
      [paperId, title]
    );
    return { success: true };
  }
}

module.exports = new GateService();
