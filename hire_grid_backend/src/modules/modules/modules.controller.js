const modulesService = require("./modules.service");

class ModulesController {
  async getModules(req, res, next) {
    try {
      const modules = await modulesService.getModules(req.query, req.user);
      res.json({ success: true, modules });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveModules(req, res, next) {
    try {
      const result = await modulesService.saveModules(req.body);
      res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async deleteModule(req, res, next) {
    try {
      const result = await modulesService.deleteModule(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getModuleQuestions(req, res, next) {
    try {
      const questions = await modulesService.getModuleQuestions(req.params.id, req.user);
      res.json({ success: true, questions });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async getQuestionsAdmin(req, res, next) {
    try {
      const result = await modulesService.getQuestionsAdmin(req.query, req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ModulesController();
