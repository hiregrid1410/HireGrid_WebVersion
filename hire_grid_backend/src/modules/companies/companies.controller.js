const companiesService = require("./companies.service");
const { pool } = require("../../database/connection");
const { validateContentManagerPlatformAccess } = require("../../utils/platformHelper");

class CompaniesController {
  async getCompanies(req, res, next) {
    try {
      const companies = await companiesService.getCompanies(req.query, req.user, req.platform);
      res.json({ success: true, companies });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async saveCompany(req, res, next) {
    try {
      let existingPlatform = null;
      if (req.body.id) {
        const existing = await pool.query("SELECT platform FROM companies WHERE id = $1", [req.body.id]);
        if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      }
      validateContentManagerPlatformAccess(req.user, req.body.platform, existingPlatform);
      const result = await companiesService.saveCompany(req.body);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async deleteCompany(req, res, next) {
    try {
      let existingPlatform = null;
      const existing = await pool.query("SELECT platform FROM companies WHERE id = $1", [req.params.id]);
      if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      validateContentManagerPlatformAccess(req.user, null, existingPlatform);
      const result = await companiesService.deleteCompany(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getExams(req, res, next) {
    try {
      const exams = await companiesService.getExams(req.user, req.platform);
      res.json({ success: true, exams });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async saveExam(req, res, next) {
    try {
      let existingPlatform = null;
      if (req.body.id) {
        const existing = await pool.query("SELECT platform FROM exams WHERE id = $1", [req.body.id]);
        if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      }
      validateContentManagerPlatformAccess(req.user, req.body.platform, existingPlatform);
      const result = await companiesService.saveExam(req.body);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async deleteExam(req, res, next) {
    try {
      let existingPlatform = null;
      const existing = await pool.query("SELECT platform FROM exams WHERE id = $1", [req.params.id]);
      if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      validateContentManagerPlatformAccess(req.user, null, existingPlatform);
      const result = await companiesService.deleteExam(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getHierarchyNodes(req, res, next) {
    try {
      const nodes = await companiesService.getHierarchyNodes(req.query, req.user, req.platform);
      res.json({ success: true, nodes });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async saveHierarchyNode(req, res, next) {
    try {
      let existingPlatform = null;
      if (req.body.id) {
        const existing = await pool.query("SELECT platform FROM hierarchy_nodes WHERE id = $1", [req.body.id]);
        if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      }
      validateContentManagerPlatformAccess(req.user, req.body.platform, existingPlatform);
      const result = await companiesService.saveHierarchyNode(req.body);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async deleteHierarchyNode(req, res, next) {
    try {
      let existingPlatform = null;
      const existing = await pool.query("SELECT platform FROM hierarchy_nodes WHERE id = $1", [req.params.id]);
      if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      validateContentManagerPlatformAccess(req.user, null, existingPlatform);
      const result = await companiesService.deleteHierarchyNode(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new CompaniesController();
