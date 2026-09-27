const authService = require("./auth.service");
const { ApiResponse } = require("../../utils/ApiResponse");

class AuthController {
  async signup(req, res, next) {
    try {
      const result = await authService.signup(req.body);
      return res.status(201).json({
        success: true,
        message: result.message,
        token: result.token,
        user: result.user
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return res.json({
        success: true,
        message: result.message,
        token: result.token,
        user: result.user
      });
    } catch (err) {
      if (err.deviceLimitReached) {
        return res.status(403).json({
          error: err.message,
          deviceLimitReached: true,
          maxDevices: err.maxDevices
        });
      }
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id, req.user.role);
      return res.json({
        success: true,
        user
      });
    } catch (err) {
      next(err);
    }
  }

  async googleLogin(req, res, next) {
    try {
      const result = await authService.googleLogin(req.body);
      return res.json({
        success: true,
        message: result.message,
        token: result.token,
        user: result.user
      });
    } catch (err) {
      if (err.deviceLimitReached) {
        return res.status(403).json({
          error: err.message,
          deviceLimitReached: true,
          maxDevices: err.maxDevices
        });
      }
      next(err);
    }
  }

  async sendOtp(req, res, next) {
    try {
      const result = await authService.sendOtp(req.body.email);
      return res.json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }

  async resendOtp(req, res, next) {
    try {
      const result = await authService.sendOtp(req.body.email);
      return res.json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const result = await authService.verifyOtp(req.body.email, req.body.otp);
      return res.json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
