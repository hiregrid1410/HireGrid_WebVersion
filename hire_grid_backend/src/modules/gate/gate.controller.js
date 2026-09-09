const gateService = require("./gate.service");

class GateController {
  async getGateBranches(req, res, next) {
    try {
      const branches = await gateService.getGateBranches();
      res.json({ success: true, branches });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveGateBranch(req, res, next) {
    try {
      const result = await gateService.saveGateBranch(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getGatePapers(req, res, next) {
    try {
      const papers = await gateService.getGatePapers();
      res.json({ success: true, papers });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveGatePaper(req, res, next) {
    try {
      const result = await gateService.saveGatePaper(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new GateController();
