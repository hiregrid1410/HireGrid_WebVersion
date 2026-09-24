const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const authRepo = require("./auth.repository");
const config = require("../../config");
const { ApiError } = require("../../utils/ApiError");
const { formatUserResponse } = require("../../utils/helpers");
const otpService = require("../../services/otp.service");
const emailService = require("../../services/email.service");

class AuthService {
  generateToken(user) {
    const jwtSecret = config.jwt.secret;
    if (!jwtSecret) {
      throw new ApiError(500, "Server authentication error: JWT_SECRET not configured.");
    }
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: config.jwt.expire }
    );
  }

  async signup({ name, email, password, role = "student", branch, semester, specialization }) {
    if (!email || !password || !name) {
      throw new ApiError(400, "Name, email, and password are required.");
    }

    const emailTrimmed = email.trim().toLowerCase();
    let targetTable;
    if (role === "student") {
      targetTable = "users";
    } else if (role === "content_manager") {
      targetTable = "content_managers";
    } else {
      targetTable = "admin_users";
    }

    const exists = await authRepo.checkExistingEmail(targetTable, emailTrimmed);
    if (exists) {
      throw new ApiError(400, "User with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    let user;
    if (role === "student") {
      user = await authRepo.createStudent({
        id: userId,
        email: emailTrimmed,
        password: hashedPassword,
        name,
        role,
        branch,
        semester,
        specialization
      });
    } else if (role === "content_manager") {
      user = await authRepo.createContentManager({
        id: userId,
        email: emailTrimmed,
        password: hashedPassword,
        name,
        role
      });
    } else {
      user = await authRepo.createAdmin({
        id: userId,
        email: emailTrimmed,
        password: hashedPassword,
        name,
        role
      });
    }

    const token = this.generateToken(user);
    return {
      message: "Registration successful.",
      token,
      user: formatUserResponse(user)
    };
  }

  async validateAndRegisterDevice(user, deviceId, deviceName) {
    if (!deviceId) return { allowed: true };

    const maxDevices = user.max_devices !== undefined && user.max_devices !== null ? Number(user.max_devices) : 1;
    let allowedDevices = Array.isArray(user.allowed_devices)
      ? user.allowed_devices
      : typeof user.allowed_devices === "string"
      ? JSON.parse(user.allowed_devices || "[]")
      : [];

    const existingDeviceIndex = allowedDevices.findIndex((d) => d.id === deviceId || d.deviceId === deviceId);

    if (existingDeviceIndex !== -1) {
      allowedDevices[existingDeviceIndex].lastLoginAt = Date.now();
      if (deviceName) allowedDevices[existingDeviceIndex].name = deviceName;

      await authRepo.updateUserDevices(user.id, allowedDevices, deviceId);
      user.allowed_devices = allowedDevices;
      user.device_id = deviceId;
      return { allowed: true };
    }

    if (allowedDevices.length < maxDevices) {
      const newDevObj = {
        id: deviceId,
        deviceId: deviceId,
        name: deviceName || "Browser Session",
        addedAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      allowedDevices.push(newDevObj);

      await authRepo.updateUserDevices(user.id, allowedDevices, deviceId);
      user.allowed_devices = allowedDevices;
      user.device_id = deviceId;
      return { allowed: true };
    }

    const reqId = crypto.randomUUID();
    try {
      await authRepo.createDeviceRequest({
        id: reqId,
        userId: user.id,
        userName: user.name || "Student",
        userEmail: user.email,
        deviceId,
        deviceName: deviceName || "Unknown Device"
      });
    } catch (err) {
      console.error("Device request insert warning:", err.message);
    }

    return {
      allowed: false,
      maxDevices,
      currentCount: allowedDevices.length,
      message: `Login allowed on ${maxDevices} device(s) only. Device limit reached. Please contact Super Admin for multi-device permission.`,
    };
  }

  async login({ email, password, isAdminLogin = false, deviceId, deviceName }) {
    if (!password || (!isAdminLogin && (!email || email.trim() === ""))) {
      throw new ApiError(400, isAdminLogin ? "Password is required." : "Email and password are required.");
    }

    let user = null;
    const emailTrimmed = email ? email.trim().toLowerCase() : "";

    if (!emailTrimmed && isAdminLogin) {
      const targetEmail = config.admin.email || "saumya@admin.com";
      const adminUser = await authRepo.findFirstAdmin(targetEmail);
      if (!adminUser) {
        throw new ApiError(401, "No admin user found in database.");
      }

      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (!isMatch) {
        throw new ApiError(401, "Invalid password.");
      }
      user = adminUser;
    } else {
      let foundUser = null;
      if (isAdminLogin) {
        foundUser = await authRepo.findStaffByEmail(emailTrimmed);
        if (!foundUser) {
          foundUser = await authRepo.findUserByEmail(emailTrimmed);
        }
      } else {
        foundUser = await authRepo.findUserByEmail(emailTrimmed);
        if (!foundUser) {
          foundUser = await authRepo.findStaffByEmail(emailTrimmed);
        }
      }

      if (!foundUser) {
        throw new ApiError(401, "Invalid email or password.");
      }

      if (foundUser.role === "student" && !foundUser.password && foundUser.google_id) {
        throw new ApiError(400, "This account is registered via Google. Please use 'Log in with Google'.");
      }

      if (!foundUser.password) {
        throw new ApiError(401, "Invalid email or password.");
      }

      const isMatch = await bcrypt.compare(password, foundUser.password);
      if (!isMatch) {
        throw new ApiError(401, "Invalid email or password.");
      }

      user = foundUser;

      if (user.role === "student") {
        const deviceCheck = await this.validateAndRegisterDevice(user, deviceId, deviceName);
        if (!deviceCheck.allowed) {
          const err = new ApiError(403, deviceCheck.message);
          err.deviceLimitReached = true;
          err.maxDevices = deviceCheck.maxDevices;
          throw err;
        }
      }
    }

    const token = this.generateToken(user);
    return {
      message: "Login successful.",
      token,
      user: formatUserResponse(user)
    };
  }

  async getMe(id, role) {
    let targetTable;
    if (role === "student") {
      targetTable = "users";
    } else if (role === "content_manager") {
      targetTable = "content_managers";
    } else {
      targetTable = "admin_users";
    }

    const user = await authRepo.findByIdInTable(targetTable, id);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }
    return formatUserResponse(user);
  }

  async googleLogin({ credential, deviceId, deviceName }) {
    if (!credential) {
      throw new ApiError(400, "Google credential is required.");
    }

    const googleVerifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!googleVerifyRes.ok) {
      throw new ApiError(401, "Google credential verification failed. Invalid signature.");
    }

    const payload = await googleVerifyRes.json();
    const { sub: googleId, email, name, picture } = payload;

    if (!email || !googleId) {
      throw new ApiError(400, "Invalid Google token data.");
    }

    let user = await authRepo.findUserByGoogleIdOrEmail(googleId, email.toLowerCase());

    if (user) {
      if (!user.google_id) {
        await authRepo.linkGoogleAccount(user.id, googleId, picture);
        user.google_id = googleId;
        user.auth_provider = "google";
        user.profile_picture = picture;
      }
    } else {
      const userId = crypto.randomUUID();
      user = await authRepo.createGoogleStudent({
        id: userId,
        email: email.toLowerCase(),
        name: name || "Google User",
        googleId,
        picture
      });
    }

    const deviceCheck = await this.validateAndRegisterDevice(user, deviceId, deviceName);
    if (!deviceCheck.allowed) {
      const err = new ApiError(403, deviceCheck.message);
      err.deviceLimitReached = true;
      err.maxDevices = deviceCheck.maxDevices;
      throw err;
    }

    const token = this.generateToken(user);
    return {
      message: "Google login successful.",
      token,
      user: formatUserResponse(user)
    };
  }

  async sendOtp(email) {
    if (!email) {
      throw new ApiError(400, "Email is required.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format.");
    }

    const emailLower = email.trim().toLowerCase();
    const cooldownCheck = await otpService.checkOtpCooldown(emailLower);
    if (!cooldownCheck.allowed) {
      throw new ApiError(429, cooldownCheck.message);
    }

    const otp = otpService.generateOtp();
    await otpService.saveOtp(emailLower, otp);
    await emailService.sendOtpEmail(emailLower, otp, "Verification");

    return { message: "OTP sent successfully." };
  }

  async verifyOtp(email, otp) {
    if (!email || !otp) {
      throw new ApiError(400, "Email and OTP are required.");
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      throw new ApiError(400, "OTP must be exactly 6 numeric digits.");
    }

    const emailLower = email.trim().toLowerCase();
    const user = await authRepo.findUserByEmail(emailLower);
    if (!user) {
      throw new ApiError(400, "Email address not registered.");
    }

    const verification = await otpService.verifyOtp(emailLower, otp);
    if (!verification.success) {
      throw new ApiError(400, verification.message);
    }

    await authRepo.markEmailVerified(emailLower);
    return { message: "Email verified successfully." };
  }
}

module.exports = new AuthService();
