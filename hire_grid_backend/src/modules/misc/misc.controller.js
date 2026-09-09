const miscService = require("./misc.service");

class MiscController {
  async getSettings(req, res, next) {
    try {
      const settings = await miscService.getSettings(req.params.id);
      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveSettings(req, res, next) {
    try {
      const result = await miscService.saveSettings(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getStats(req, res, next) {
    try {
      const { totalStudents, chartData } = await miscService.getStats();
      res.json({ success: true, totalStudents, chartData });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async logSecurityEvent(req, res, next) {
    try {
      const result = await miscService.logSecurityEvent(req.user, req.body);
      res.json(result);
    } catch (err) {
      console.error("Log security event error:", err);
      res.status(500).json({ error: "Failed to record security log." });
    }
  }

  async getSecurityLogs(req, res, next) {
    try {
      const logs = await miscService.getSecurityLogs(req.user);
      res.json({ success: true, logs });
    } catch (err) {
      res.status(403).json({ error: err.message });
    }
  }

  async getFeedbacks(req, res, next) {
    try {
      const feedbacks = await miscService.getFeedbacks(req.query);
      res.json({ success: true, feedbacks });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createFeedback(req, res, next) {
    try {
      const result = await miscService.createFeedback(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteFeedback(req, res, next) {
    try {
      const result = await miscService.deleteFeedback(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getAccessRequests(req, res, next) {
    try {
      const requests = await miscService.getAccessRequests();
      res.json({ success: true, requests });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createAccessRequest(req, res, next) {
    try {
      const result = await miscService.createAccessRequest(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getNotifications(req, res, next) {
    res.json({ success: true, notifications: [] });
  }

  async getPurchases(req, res, next) {
    try {
      const purchases = await miscService.getPurchases(req.query);
      res.json({ success: true, purchases });
    } catch (err) {
      res.json({ success: true, purchases: [] });
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const logs = await miscService.getAuditLogs(req.query);
      res.json({ success: true, logs, audit_logs: logs });
    } catch (err) {
      res.json({ success: true, logs: [], audit_logs: [] });
    }
  }
}

module.exports = new MiscController();
