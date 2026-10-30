const modulesService = require("./modules.service");
const { pool } = require("../../database/connection");
const { validateContentManagerPlatformAccess } = require("../../utils/platformHelper");

class ModulesController {
  async getModules(req, res, next) {
    try {
      const modules = await modulesService.getModules(req.query, req.user, req.platform);
      res.json({ success: true, modules });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async saveModules(req, res, next) {
    try {
      const targetMod = Array.isArray(req.body.modules) ? req.body.modules[0] : req.body;
      const targetId = targetMod?.id;
      const targetPlatform = targetMod?.platform || "both";
      let existingPlatform = null;
      if (targetId) {
        const existing = await pool.query("SELECT platform FROM modules WHERE id = $1", [targetId]);
        if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      }
      validateContentManagerPlatformAccess(req.user, targetPlatform, existingPlatform);
      const result = await modulesService.saveModules(req.body);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async deleteModule(req, res, next) {
    try {
      let existingPlatform = null;
      const existing = await pool.query("SELECT platform FROM modules WHERE id = $1", [req.params.id]);
      if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      validateContentManagerPlatformAccess(req.user, null, existingPlatform);
      const result = await modulesService.deleteModule(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getModuleQuestions(req, res, next) {
    try {
      const questions = await modulesService.getModuleQuestions(req.params.id, req.user, req.platform);
      res.json({ success: true, questions });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getQuestionsAdmin(req, res, next) {
    try {
      const result = await modulesService.getQuestionsAdmin(req.query, req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new ModulesController();
