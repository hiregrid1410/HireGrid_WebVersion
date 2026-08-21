const express = require("express");
const router = express.Router();
const placementMissionController = require("../controllers/placementMissionController");
const authMiddleware = require("../middlewares/authMiddleware");
const { sensitiveActionRateLimiter } = require("../middlewares/securityMiddleware");

// All placement mission routes require authentication
router.use(authMiddleware);

// --- Student Endpoints ---
router.get("/missions", placementMissionController.getMissions);
router.post("/attempts/start", sensitiveActionRateLimiter, placementMissionController.startMissionAttempt);
router.post("/attempts/:id/sync", placementMissionController.syncMissionAttempt);
router.post("/attempts/:id/submit", sensitiveActionRateLimiter, placementMissionController.submitMissionAttempt);
router.get("/leaderboard", placementMissionController.getLeaderboard);

// --- Content Manager / Admin Endpoints ---
router.get("/content-manager/modules", placementMissionController.getMissionsCM);
router.post("/content-manager/modules", placementMissionController.createMissionCM);
router.put("/content-manager/modules/:id", placementMissionController.updateMissionCM);
router.delete("/content-manager/modules/:id", placementMissionController.deleteMissionCM);

router.get("/content-manager/attempts", placementMissionController.getAttemptsCM);
router.patch("/content-manager/attempts/:id/invalidate", placementMissionController.invalidateAttemptCM);

router.get("/content-manager/cycles", placementMissionController.getCyclesCM);
router.post("/content-manager/cycles", placementMissionController.createCycleCM);
router.post("/content-manager/recalculate-leaderboard", placementMissionController.recalculateLeaderboardCM);

module.exports = router;
