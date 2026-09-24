const plansService = require("./plans.service");

class PlansController {
  async getPlans(req, res, next) {
    try {
      const plans = await plansService.getPlans(req.query);
      res.json({ success: true, plans });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPlanById(req, res, next) {
    try {
      const plan = await plansService.getPlanById(req.params.id);
      res.json({ success: true, plan });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async savePlan(req, res, next) {
    try {
      const result = await plansService.savePlan(req.body);
      res.json({ success: true, plan: result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async deletePlan(req, res, next) {
    try {
      const result = await plansService.deletePlan(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPaymentRequests(req, res, next) {
    try {
      const requests = await plansService.getPaymentRequests();
      res.json({ success: true, requests });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createPaymentRequest(req, res, next) {
    try {
      const result = await plansService.createPaymentRequest(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updatePaymentRequest(req, res, next) {
    try {
      const result = await plansService.updatePaymentRequest(req.params.id, req.body.status);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new PlansController();
