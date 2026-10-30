const plansService = require("./plans.service");
const { pool } = require("../../database/connection");
const { validateContentManagerPlatformAccess } = require("../../utils/platformHelper");

class PlansController {
  async getPlans(req, res, next) {
    try {
      const plans = await plansService.getPlans(req.query, req.platform, req.user?.role);
      res.json({ success: true, plans });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getPlanById(req, res, next) {
    try {
      const plan = await plansService.getPlanById(req.params.id, req.platform, req.user?.role);
      res.json({ success: true, plan });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async savePlan(req, res, next) {
    try {
      let existingPlatform = null;
      if (req.body.id) {
        const existing = await pool.query("SELECT platform FROM plans WHERE id = $1", [req.body.id]);
        if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      }
      validateContentManagerPlatformAccess(req.user, req.body.platform, existingPlatform);
      const result = await plansService.savePlan(req.body);
      res.json({ success: true, plan: result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async deletePlan(req, res, next) {
    try {
      let existingPlatform = null;
      const existing = await pool.query("SELECT platform FROM plans WHERE id = $1", [req.params.id]);
      if (existing.rows.length > 0) existingPlatform = existing.rows[0].platform;
      validateContentManagerPlatformAccess(req.user, null, existingPlatform);
      const result = await plansService.deletePlan(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getPaymentRequests(req, res, next) {
    try {
      const requests = await plansService.getPaymentRequests();
      res.json({ success: true, requests });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async createPaymentRequest(req, res, next) {
    try {
      const result = await plansService.createPaymentRequest(req.body);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async updatePaymentRequest(req, res, next) {
    try {
      const result = await plansService.updatePaymentRequest(req.params.id, req.body.status);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new PlansController();
