const branchesService = require("./branches.service");

class BranchesController {
  async getBranches(req, res, next) {
    try {
      const branches = await branchesService.getBranches();
      res.json({ success: true, branches });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getActiveBranches(req, res, next) {
    try {
      const branches = await branchesService.getActiveBranches();
      res.json({ success: true, branches });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveBranch(req, res, next) {
    try {
      const result = await branchesService.saveBranch(req.body, req.user?.id);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteBranch(req, res, next) {
    try {
      const result = await branchesService.deleteBranch(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async getCompanyBranches(req, res, next) {
    try {
      const mappings = await branchesService.getCompanyBranches(req.params.companyId);
      res.json({ success: true, mappings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveCompanyBranches(req, res, next) {
    try {
      const result = await branchesService.saveCompanyBranches(
        req.params.companyId,
        req.body.assignmentScope,
        req.body.branchIds,
        req.user
      );
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveCompanyBranchesBatch(req, res, next) {
    try {
      const result = await branchesService.saveCompanyBranchesBatch(
        req.body.companyIds,
        req.body.assignmentScope,
        req.body.branchIds,
        req.user
      );
      res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async getContentMappings(req, res, next) {
    try {
      const mappings = await branchesService.getContentMappings(req.params.contentType, req.params.contentId);
      res.json({ success: true, mappings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveContentMappings(req, res, next) {
    try {
      const result = await branchesService.saveContentMappings(
        req.params.contentType,
        req.params.contentId,
        req.body.assignmentScope,
        req.body.branchIds,
        req.user
      );
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveContentMappingsBatch(req, res, next) {
    try {
      const result = await branchesService.saveContentMappingsBatch(
        req.params.contentType,
        req.body.contentIds,
        req.body.assignmentScope,
        req.body.branchIds,
        req.user
      );
      res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new BranchesController();
