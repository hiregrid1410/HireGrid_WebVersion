const { pool } = require("../../database/connection");
const crypto = require("crypto");

class PlacementMissionRepository {
  async getUserBranchId(userId) {
    if (!userId) return null;
    try {
      const userRes = await pool.query("SELECT branch_id FROM users WHERE id = $1", [userId]);
      if (userRes.rows.length > 0 && userRes.rows[0].branch_id) {
        return userRes.rows[0].branch_id;
      }
      const generalBranchRes = await pool.query("SELECT id FROM branches WHERE is_general = TRUE LIMIT 1");
      if (generalBranchRes.rows.length > 0) {
        return generalBranchRes.rows[0].id;
      }
    } catch (err) {
      console.error("getUserBranchId error:", err.message);
    }
    return null;
  }

  async isUserPremium(userId) {
    const result = await pool.query(
      "SELECT has_full_premium, active_plan_id, plan_expiry FROM users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) return false;
    const user = result.rows[0];
    const isPremium = user.has_full_premium || user.active_plan_id;
    const notExpired = !user.plan_expiry || Date.now() <= Number(user.plan_expiry);
    return !!(isPremium && notExpired);
  }

  async getActiveCycle() {
    const res = await pool.query(
      "SELECT * FROM placement_mission_cycles WHERE is_active = TRUE LIMIT 1"
    );
    if (res.rows.length === 0) {
      return { id: "cycle_1", name: "Cycle 1" };
    }
    return res.rows[0];
  }

  async getCycleById(cycleId) {
    const res = await pool.query("SELECT * FROM placement_mission_cycles WHERE id = $1", [cycleId]);
    return res.rows[0] || null;
  }

  async getPlacementModulesByCycleAndBranch(cycleId, branchId) {
    const res = await pool.query(
      `SELECT m.id, m.title, m.description, m.time_limit AS "timeLimit", m.total_marks AS "totalMarks",
              m.start_time AS "startTime", m.end_time AS "endTime", m.publication_status AS "publicationStatus",
              (SELECT COUNT(*) FROM questions q WHERE q.module_id = m.id) AS "questionCount"
       FROM modules m
       WHERE m.is_placement_mission = TRUE AND m.is_active = TRUE AND m.cycle_id = $1
         AND (m.publication_status = 'PUBLISHED' OR m.publication_status IS NULL)
         AND EXISTS (
           SELECT 1 FROM content_branch_mappings cobm
           WHERE cobm.content_id = m.id AND cobm.content_type = 'module'
             AND (cobm.assignment_scope = 'ALL' OR cobm.branch_id = $2)
         )
       ORDER BY m.display_order ASC, m.created_at ASC`,
      [cycleId, branchId]
    );
    return res.rows;
  }

  async getAttemptsForUserInCycle(userId, cycleId) {
    const res = await pool.query(
      `SELECT module_id, status, expires_at, score, xp_earned, accuracy, is_valid
       FROM placement_mission_attempts
       WHERE user_id = $1 AND cycle_id = $2`,
      [userId, cycleId]
    );
    return res.rows;
  }

  async getAttemptById(attemptId) {
    const res = await pool.query(
      `SELECT * FROM placement_mission_attempts WHERE id = $1`,
      [attemptId]
    );
    return res.rows[0] || null;
  }

  async getActiveAttempt(userId, moduleId, cycleId) {
    const res = await pool.query(
      `SELECT * FROM placement_mission_attempts WHERE user_id = $1 AND module_id = $2 AND cycle_id = $3`,
      [userId, moduleId, cycleId]
    );
    return res.rows[0] || null;
  }

  async createAttempt({ id, userId, moduleId, cycleId, startTime, expiresAt, totalTimeSeconds }) {
    const res = await pool.query(
      `INSERT INTO placement_mission_attempts (
        id, user_id, module_id, cycle_id, status, start_time, expires_at, total_time_seconds
       )
       VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)
       RETURNING *`,
      [id, userId, moduleId, cycleId, startTime, expiresAt, totalTimeSeconds]
    );
    return res.rows[0];
  }

  async getModuleDetails(moduleId) {
    const res = await pool.query(
      `SELECT * FROM modules WHERE id = $1 AND is_placement_mission = TRUE AND is_active = TRUE`,
      [moduleId]
    );
    return res.rows[0] || null;
  }

  async getModuleQuestionsForExam(moduleId) {
    const res = await pool.query(
      `SELECT id, question, options, image_url, svg_code, type, positive_marks, negative_marks, display_order
       FROM questions
       WHERE module_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [moduleId]
    );
    return res.rows;
  }

  async getModuleQuestionsWithAnswers(moduleId) {
    const res = await pool.query(
      `SELECT id, question, options, correct_answer_index, correct_option_index, correct_answers,
              positive_marks, negative_marks, type
       FROM questions
       WHERE module_id = $1`,
      [moduleId]
    );
    return res.rows;
  }

  async updateAttemptSync({ attemptId, answersJson, violationCount, suspiciousFlagsJson, timeSpentSeconds, clientHeartbeatAt }) {
    await pool.query(
      `UPDATE placement_mission_attempts
       SET answers = $1,
           tab_switch_count = $2,
           suspicious_flags = $3,
           time_spent_seconds = $4,
           client_heartbeat_at = $5
       WHERE id = $6 AND status = 'active'`,
      [answersJson, violationCount, suspiciousFlagsJson, timeSpentSeconds, clientHeartbeatAt, attemptId]
    );
  }

  async finalizeAttemptSubmission({
    attemptId, status, score, maxScore, xpEarned, accuracy,
    timeSpentSeconds, answersJson, violationCount, suspiciousFlagsJson,
    isValid, invalidReason
  }) {
    const res = await pool.query(
      `UPDATE placement_mission_attempts
       SET status = $1,
           score = $2,
           max_score = $3,
           xp_earned = $4,
           accuracy = $5,
           time_spent_seconds = $6,
           answers = $7,
           tab_switch_count = $8,
           suspicious_flags = $9,
           is_valid = $10,
           invalid_reason = $11,
           submitted_at = $12
       WHERE id = $13
       RETURNING *`,
      [
        status, score, maxScore, xpEarned, accuracy,
        timeSpentSeconds, answersJson, violationCount, suspiciousFlagsJson,
        isValid, invalidReason, Date.now(), attemptId
      ]
    );
    return res.rows[0];
  }
}

module.exports = new PlacementMissionRepository();
