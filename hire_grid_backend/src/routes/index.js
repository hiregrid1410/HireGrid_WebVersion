const express = require("express");
const router = express.Router();

const { authRoutes } = require("../modules/auth");
const { storageRoutes } = require("../modules/storage");
const { placementMissionRoutes } = require("../modules/placement-missions");
const apiRoutes = require("./api.routes");

// Mount sub-routers preserving exact route paths
router.use("/auth", authRoutes);
router.use("/storage", storageRoutes);
router.use("/placement-mission", placementMissionRoutes);
router.use("/", apiRoutes);

module.exports = router;
