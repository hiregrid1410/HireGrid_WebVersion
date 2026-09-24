const authRoutes = require("./auth.routes");
const authController = require("./auth.controller");
const authService = require("./auth.service");
const authRepository = require("./auth.repository");

module.exports = {
  authRoutes,
  authController,
  authService,
  authRepository
};
