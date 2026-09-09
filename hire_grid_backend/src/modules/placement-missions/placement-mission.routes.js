const express = require("express");
const router = express.Router();
const placementMissionController = require("./placement-mission.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { sensitiveActionRateLimiter } = require("../../middlewares/rateLimit.middleware");

// All placement mission routes require authentication
router.use(authenticate);

// --- Student Endpoints ---
router.get("/missions", (req, res, next) => placementMissionController.getMissions(req, res, next));
router.post("/attempts/start", sensitiveActionRateLimiter, (req, res, next) => placementMissionController.startMissionAttempt(req, res, next));
router.post("/attempts/:id/sync", (req, res, next) => placementMissionController.syncMissionAttempt(req, res, next));
router.post("/attempts/:id/submit", sensitiveActionRateLimiter, (req, res, next) => placementMissionController.submitMissionAttempt(req, res, next));
router.get("/leaderboard", (req, res, next) => placementMissionController.getLeaderboard(req, res, next));

// --- Content Manager / Admin Endpoints ---
router.get("/content-manager/modules", (req, res, next) => placementMissionController.getMissionsCM(req, res, next));
router.post("/content-manager/modules", (req, res, next) => placementMissionController.createMissionCM(req, res, next));
router.put("/content-manager/modules/:id", (req, res, next) => placementMissionController.updateMissionCM(req, res, next));
router.delete("/content-manager/modules/:id", (req, res, next) => placementMissionController.deleteMissionCM(req, res, next));

router.get("/content-manager/attempts", (req, res, next) => placementMissionController.getAttemptsCM(req, res, next));
router.patch("/content-manager/attempts/:id/invalidate", (req, res, next) => placementMissionController.invalidateAttemptCM(req, res, next));

router.get("/content-manager/cycles", (req, res, next) => placementMissionController.getCyclesCM(req, res, next));
router.post("/content-manager/cycles", (req, res, next) => placementMissionController.createCycleCM(req, res, next));
router.post("/content-manager/recalculate-leaderboard", (req, res, next) => placementMissionController.recalculateLeaderboardCM(req, res, next));

module.exports = router;
