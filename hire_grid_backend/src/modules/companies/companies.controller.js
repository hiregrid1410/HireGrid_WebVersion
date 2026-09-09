const companiesService = require("./companies.service");

class CompaniesController {
  async getCompanies(req, res, next) {
    try {
      const companies = await companiesService.getCompanies(req.query, req.user);
      res.json({ success: true, companies });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveCompany(req, res, next) {
    try {
      const result = await companiesService.saveCompany(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteCompany(req, res, next) {
    try {
      const result = await companiesService.deleteCompany(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getExams(req, res, next) {
    try {
      const exams = await companiesService.getExams(req.user);
      res.json({ success: true, exams });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveExam(req, res, next) {
    try {
      const result = await companiesService.saveExam(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteExam(req, res, next) {
    try {
      const result = await companiesService.deleteExam(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getHierarchyNodes(req, res, next) {
    try {
      const nodes = await companiesService.getHierarchyNodes(req.query, req.user);
      res.json({ success: true, nodes });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveHierarchyNode(req, res, next) {
    try {
      const result = await companiesService.saveHierarchyNode(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteHierarchyNode(req, res, next) {
    try {
      const result = await companiesService.deleteHierarchyNode(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new CompaniesController();
