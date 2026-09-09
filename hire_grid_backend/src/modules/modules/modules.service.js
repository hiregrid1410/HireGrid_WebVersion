const modulesRepo = require("./modules.repository");
const { verifyUserItemAccess, dbCache } = require("../../services/accessChecker.service");
const { pool } = require("../../database/connection");
const { ApiError } = require("../../utils/ApiError");

class ModulesService {
  async getModules(query, user) {
    return modulesRepo.getModules(query, user);
  }

  async saveModules(body) {
    let modulesList = body.modules;
    if (!modulesList) {
      if (body.id && body.title) {
        modulesList = [body];
      } else {
        throw new ApiError(400, "Invalid modules format");
      }
    } else if (!Array.isArray(modulesList)) {
      modulesList = [modulesList];
    }

    await modulesRepo.saveModules(modulesList);
    return { success: true };
  }

  async deleteModule(id) {
    await modulesRepo.deleteModule(id);
    return { success: true };
  }

  async getModuleQuestions(id, user) {
    const userId = user ? user.id : null;
    let role = "student";
    
    const accessCheck = await verifyUserItemAccess(userId, id, "module");
    if (!accessCheck.allowed) {
      throw new ApiError(403, accessCheck.reason || "Module access locked under current plan.");
    }
    
    let includeCorrectAnswers = false;
    if (userId) {
      role = dbCache.get(`role:${userId}`);
      if (!role) {
        const adminCheck = await pool.query(
          "SELECT role FROM admin_users WHERE id = $1 UNION SELECT role FROM content_managers WHERE id = $1",
          [userId]
        );
        role = adminCheck.rows.length > 0 ? adminCheck.rows[0].role : "student";
        dbCache.set(`role:${userId}`, role, 300000);
      }
      if (role === "admin" || role === "content_manager") {
        includeCorrectAnswers = true;
      } else {
        const completedCheck = await pool.query(
          "SELECT module_scores FROM users WHERE id = $1",
          [userId]
        );
        if (completedCheck.rows.length > 0) {
          let scores = completedCheck.rows[0].module_scores || {};
          if (typeof scores === "string") {
            try {
              scores = JSON.parse(scores);
            } catch (e) {
              scores = {};
            }
          }
          if (scores[id]) {
            includeCorrectAnswers = true;
          }
        }
      }
    }

    const modCheck = await pool.query("SELECT is_placement_mission, publication_status FROM modules WHERE id = $1", [id]);
    if (modCheck.rows.length === 0) {
      throw new ApiError(404, "Module not found.");
    }
    const isPlacementMission = !!modCheck.rows[0].is_placement_mission;
    const publicationStatus = modCheck.rows[0].publication_status || 'PUBLISHED';
    if (publicationStatus === 'DRAFT' && role !== "admin" && role !== "content_manager") {
      throw new ApiError(403, "This module is currently in draft.");
    }
    if (isPlacementMission && role !== "admin" && role !== "content_manager") {
      includeCorrectAnswers = false;
    }

    const result = await pool.query(
      `SELECT id, question, options, 
              ${includeCorrectAnswers ? "correct_answer_index" : "NULL"} AS "correctAnswerIndex", 
              svg_code AS "svgCode", display_order AS "displayOrder"
       FROM questions
       WHERE module_id = $1
       ORDER BY display_order ASC`,
      [id]
    );

    return result.rows;
  }

  async getQuestionsAdmin(query, user) {
    const role = user?.role;
    if (role !== "admin" && role !== "content_manager") {
      throw new ApiError(403, "Access Denied. Admins and Content Managers only.");
    }
    return modulesRepo.getQuestionsAdmin(query);
  }
}

module.exports = new ModulesService();
