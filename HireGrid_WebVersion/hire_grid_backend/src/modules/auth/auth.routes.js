const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const authenticate = require("../../middlewares/auth.middleware");
const { authRateLimiter, otpRateLimiter } = require("../../middlewares/rateLimit.middleware");

// Signup
router.post("/signup", authRateLimiter, (req, res, next) => authController.signup(req, res, next));

// Login
router.post("/login", authRateLimiter, (req, res, next) => authController.login(req, res, next));

// Google Sign-In
router.post("/google", authRateLimiter, (req, res, next) => authController.googleLogin(req, res, next));

// Get current profile
router.get("/me", authenticate, (req, res, next) => authController.getMe(req, res, next));

// OTP Verification endpoints
router.post("/send-otp", otpRateLimiter, (req, res, next) => authController.sendOtp(req, res, next));
router.post("/verify-otp", otpRateLimiter, (req, res, next) => authController.verifyOtp(req, res, next));
router.post("/resend-otp", otpRateLimiter, (req, res, next) => authController.resendOtp(req, res, next));

module.exports = router;
