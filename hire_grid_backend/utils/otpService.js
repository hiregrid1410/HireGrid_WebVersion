const crypto = require("crypto");
const { pool } = require("../config/db");

/**
 * Generate a random 6-digit numeric OTP.
 */
const generateOtp = () => {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
};

/**
 * Check if the email is allowed to request a new OTP (60s cooldown).
 */
const checkOtpCooldown = async (email) => {
  const emailLower = email.toLowerCase();
  
  const lastOtpResult = await pool.query(
    `SELECT created_at FROM otps 
     WHERE email = $1 
     ORDER BY created_at DESC LIMIT 1`,
    [emailLower]
  );
  
  if (lastOtpResult.rows.length > 0) {
    const lastCreatedAt = new Date(lastOtpResult.rows[0].created_at).getTime();
    const timePassedSeconds = (Date.now() - lastCreatedAt) / 1000;
    if (timePassedSeconds < 60) {
      return {
        allowed: false,
        message: `Please wait ${Math.ceil(60 - timePassedSeconds)} seconds before requesting a new OTP.`,
      };
    }
  }

  return { allowed: true };
};

/**
 * Save or update the OTP for an email.
 * Ensures only one active OTP exists per email.
 */
const saveOtp = async (email, otp) => {
  const emailLower = email.toLowerCase();
  
  // Invalidate any existing active OTPs for this email first
  await pool.query(
    `DELETE FROM otps WHERE email = $1`,
    [emailLower]
  );

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO otps (id, email, otp, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, emailLower, otp, expiresAt]
  );
};

/**
 * Verifies the OTP for an email.
 */
const verifyOtp = async (email, otpCode) => {
  const emailLower = email.toLowerCase();

  const otpResult = await pool.query(
    `SELECT * FROM otps 
     WHERE email = $1 AND is_verified = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [emailLower]
  );

  if (otpResult.rows.length === 0) {
    return {
      success: false,
      message: "No active verification code found for this email. Please request a new code.",
    };
  }

  const otpRecord = otpResult.rows[0];

  // Brute-force protection: lock after 5 failed attempts
  if (otpRecord.failed_attempts >= 5) {
    return {
      success: false,
      message: "Too many failed attempts. This OTP session is locked. Please request a new code.",
    };
  }

  // Check expiration
  if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
    await pool.query(`DELETE FROM otps WHERE id = $1`, [otpRecord.id]);
    return {
      success: false,
      message: "The verification code has expired. Please request a new code.",
    };
  }

  // Verify OTP match
  if (otpRecord.otp !== otpCode) {
    const newFailedAttempts = otpRecord.failed_attempts + 1;
    await pool.query(
      `UPDATE otps SET failed_attempts = $1, last_attempt_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newFailedAttempts, otpRecord.id]
    );

    if (newFailedAttempts >= 5) {
      await pool.query(`DELETE FROM otps WHERE id = $1`, [otpRecord.id]);
      return {
        success: false,
        message: "Incorrect code. Too many failed attempts. Verification session locked. Please request a new code.",
      };
    }

    return {
      success: false,
      message: `Incorrect verification code. ${5 - newFailedAttempts} attempts remaining.`,
    };
  }

  // Update as verified and delete/invalidate it
  await pool.query(`DELETE FROM otps WHERE id = $1`, [otpRecord.id]);

  return { success: true };
};

const bcrypt = require("bcrypt");

/**
 * Generate a cryptographically random 6-digit numeric OTP.
 */
const generateLoginOtp = () => {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
};

/**
 * Check if the email is allowed to resend login OTP:
 * - Max 1 resend per 30 seconds
 * - Max 3 resends per 15-minute window
 */
const checkLoginOtpRateLimit = async (email) => {
  const emailLower = email.toLowerCase();
  const now = Date.now();

  // 1. Check last resend timestamp for 30s cooldown
  const recentOtpResult = await pool.query(
    `SELECT created_at FROM login_otps 
     WHERE email = $1 
     ORDER BY created_at DESC LIMIT 1`,
    [emailLower]
  );

  if (recentOtpResult.rows.length > 0) {
    const lastCreatedAt = new Date(recentOtpResult.rows[0].created_at).getTime();
    const timePassedSeconds = (now - lastCreatedAt) / 1000;
    if (timePassedSeconds < 30) {
      const remainingSeconds = Math.ceil(30 - timePassedSeconds);
      return {
        allowed: false,
        retryAfterSeconds: remainingSeconds,
        message: `Please wait ${remainingSeconds} seconds before requesting a new login code.`,
      };
    }
  }

  // 2. Check 3 requests per 15-minute window
  const windowStart = new Date(now - 15 * 60 * 1000);
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM login_otps
     WHERE email = $1 AND created_at >= $2`,
    [emailLower, windowStart]
  );

  const totalInWindow = parseInt(countResult.rows[0].total, 10) || 0;
  if (totalInWindow >= 3) {
    return {
      allowed: false,
      retryAfterSeconds: 900,
      message: "Too many login code requests. Please wait 15 minutes before trying again.",
    };
  }

  return { allowed: true };
};

/**
 * Store cryptographically hashed login OTP in login_otps table.
 * Expires in 15 minutes (900s). Max attempts: 5.
 */
const saveLoginOtp = async (userId, email, rawOtp, deviceId, deviceName) => {
  const emailLower = email.toLowerCase();
  const id = crypto.randomUUID();
  const otpHash = await bcrypt.hash(rawOtp, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Invalidate any existing unused OTPs for this user
  await pool.query(
    `UPDATE login_otps SET used_at = CURRENT_TIMESTAMP WHERE email = $1 AND used_at IS NULL`,
    [emailLower]
  );

  await pool.query(
    `INSERT INTO login_otps (id, user_id, email, otp_hash, purpose, device_id, device_name, attempts, max_attempts, expires_at)
     VALUES ($1, $2, $3, $4, 'login', $5, $6, 0, 5, $7)`,
    [id, userId, emailLower, otpHash, deviceId || null, deviceName || null, expiresAt]
  );

  return { id, expiresInSeconds: 900 };
};

/**
 * Verify submitted login OTP against stored bcrypt hash with attempt lock & expiry checks.
 */
const verifyLoginOtp = async (email, otpCode) => {
  const emailLower = email.toLowerCase();

  const otpResult = await pool.query(
    `SELECT * FROM login_otps 
     WHERE email = $1 AND used_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [emailLower]
  );

  if (otpResult.rows.length === 0) {
    return {
      success: false,
      code: "OTP_EXPIRED",
      message: "No active login code found or code has already been used. Please log in again.",
    };
  }

  const record = otpResult.rows[0];

  // 1. Check expiration
  if (new Date(record.expires_at).getTime() < Date.now()) {
    await pool.query(`UPDATE login_otps SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [record.id]);
    return {
      success: false,
      code: "OTP_EXPIRED",
      message: "Login code has expired. Please request a new code.",
    };
  }

  // 2. Check max attempts lock (5 attempts)
  if (record.attempts >= record.max_attempts) {
    await pool.query(`UPDATE login_otps SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [record.id]);
    return {
      success: false,
      code: "OTP_LOCKED",
      message: "Too many failed attempts. Login session locked. Please log in again.",
    };
  }

  // 3. Compare submitted OTP against stored hash
  const isMatch = await bcrypt.compare(otpCode, record.otp_hash);
  if (!isMatch) {
    const newAttempts = record.attempts + 1;
    await pool.query(
      `UPDATE login_otps SET attempts = $1 WHERE id = $2`,
      [newAttempts, record.id]
    );

    if (newAttempts >= record.max_attempts) {
      await pool.query(`UPDATE login_otps SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [record.id]);
      return {
        success: false,
        code: "OTP_LOCKED",
        attemptsRemaining: 0,
        message: "Too many failed attempts. Please log in again.",
      };
    }

    const remaining = record.max_attempts - newAttempts;
    return {
      success: false,
      code: "OTP_INVALID",
      attemptsRemaining: remaining,
      message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // 4. Mark OTP as used
  await pool.query(
    `UPDATE login_otps SET used_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [record.id]
  );

  return {
    success: true,
    userId: record.user_id,
    deviceId: record.device_id,
    deviceName: record.device_name,
  };
};

module.exports = {
  generateOtp,
  checkOtpCooldown,
  saveOtp,
  verifyOtp,
  // Login-specific OTP functions
  generateLoginOtp,
  checkLoginOtpRateLimit,
  saveLoginOtp,
  verifyLoginOtp,
};
