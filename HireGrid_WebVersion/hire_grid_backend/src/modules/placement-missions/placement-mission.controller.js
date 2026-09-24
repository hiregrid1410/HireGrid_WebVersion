const placementMissionService = require("./placement-mission.service");

class PlacementMissionController {
  async getMissions(req, res, next) {
    try {
      const result = await placementMissionService.getMissions(req.user.id);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("getMissions error:", err);
      res.status(500).json({ error: "Failed to load missions." });
    }
  }

  async startMissionAttempt(req, res, next) {
    try {
      const result = await placementMissionService.startMissionAttempt(req.user.id, req.body.moduleId);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("startMissionAttempt error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to initialize mission attempt." });
    }
  }

  async syncMissionAttempt(req, res, next) {
    try {
      const result = await placementMissionService.syncMissionAttempt(req.user.id, req.params.id, req.body.answers);
      res.json(result);
    } catch (err) {
      console.error("syncMissionAttempt error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to sync attempt state." });
    }
  }

  async submitMissionAttempt(req, res, next) {
    try {
      const result = await placementMissionService.submitMissionAttempt(req.user.id, req.params.id, req.body.answers);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("submitMissionAttempt error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to submit attempt." });
    }
  }

  async getLeaderboard(req, res, next) {
    try {
      const result = await placementMissionService.getLeaderboard();
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("getLeaderboard error:", err);
      res.status(500).json({ error: "Failed to load leaderboard." });
    }
  }

  async recalculateLeaderboardCM(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "content_manager") {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    try {
      const cycle = await placementMissionService.getActiveCycle();
      const result = await placementMissionService.recalculateLeaderboardSnapshots(cycle.id);
      res.json({
        success: true,
        message: `Leaderboard recalculated successfully. Ranked ${result.count} premium performers.`,
      });
    } catch (err) {
      console.error("recalculateLeaderboardCM error:", err);
      res.status(500).json({ error: "Failed to recalculate rankings." });
    }
  }

  async createCycleCM(req, res, next) {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Super Admin privileges required to start a new cycle." });
    }

    try {
      const result = await placementMissionService.createCycleCM(req.body.name);
      res.json({ success: true, message: `New weekly cycle '${result.name}' started successfully.` });
    } catch (err) {
      console.error("createCycleCM error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to start new cycle." });
    }
  }

  async getCyclesCM(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "content_manager") {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    try {
      const cycles = await placementMissionService.getCyclesCM();
      res.json({ success: true, cycles });
    } catch (err) {
      console.error("getCyclesCM error:", err);
      res.status(500).json({ error: "Failed to load cycles." });
    }
  }

  async getAttemptsCM(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "content_manager") {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);

    try {
      const result = await placementMissionService.getAttemptsCM(page, limit);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("getAttemptsCM error:", err);
      res.status(500).json({ error: "Failed to fetch attempts list." });
    }
  }

  async invalidateAttemptCM(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "content_manager") {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const adminName = req.user.name || "Admin Operator";

    try {
      const result = await placementMissionService.invalidateAttemptCM(id, reason, adminName);
      res.json({ success: true, message: "Attempt successfully invalidated. Leaderboard updated." });
    } catch (err) {
      console.error("invalidateAttemptCM error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to invalidate attempt." });
    }
  }

  async getMissionsCM(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "content_manager") {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    try {
      const modules = await placementMissionService.getMissionsCM();
      res.json({ success: true, modules });
    } catch (err) {
      console.error("getMissionsCM error:", err);
      res.status(500).json({ error: "Failed to load mission modules." });
    }
  }

  async createMissionCM(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "content_manager") {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    const adminName = req.user.name || "Operator";
    try {
      const result = await placementMissionService.createMissionCM(req.body, adminName);
      res.json({ success: true, moduleId: result.moduleId });
    } catch (err) {
      console.error("createMissionCM error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to create mission module." });
    }
  }

  async updateMissionCM(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "content_manager") {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    try {
      const result = await placementMissionService.updateMissionCM(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      console.error("updateMissionCM error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to update mission module." });
    }
  }

  async deleteMissionCM(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "content_manager") {
      return res.status(403).json({ error: "Unauthorized access." });
    }

    try {
      const result = await placementMissionService.deleteMissionCM(req.params.id);
      res.json({ success: true, message: "Mission module deleted successfully." });
    } catch (err) {
      console.error("deleteMissionCM error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to delete mission module." });
    }
  }
}

module.exports = new PlacementMissionController();
