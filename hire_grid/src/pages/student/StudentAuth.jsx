import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  CheckCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { api, getDeviceId, getDeviceName } from "../../lib/api";
import { showToast } from "../../components/common/Toast";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthBrand from "../../components/auth/AuthBrand";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";

/* ─────────────────────────────────────────────────────────────
   StudentAuth
   Handles both Student Login and Student Sign-Up in one file.
   All existing API calls, payloads, field names, and redirects
   are preserved exactly.
───────────────────────────────────────────────────────────── */
export default function StudentAuth() {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ── OTP step state for login ──
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpValue, setOtpValue] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [resendCooldown, setResendCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // ── Form state (same field names as original) ──
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    branch: "",
    semester: "1",
  });

  // ── 15-minute OTP countdown & 30s resend timer ──
  useEffect(() => {
    let timer = null;
    if (isOtpStep && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpStep, timeLeft]);

  useEffect(() => {
    let timer = null;
    if (isOtpStep && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpStep, resendCooldown]);

  // Format MM:SS for 15-min countdown
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Auto-redirect if already logged in as student ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.role === "student") {
          navigate("/student-dashboard", { replace: true });
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [navigate]);

  // ── Reset form when switching modes ──
  const switchMode = (toSignUp) => {
    setIsSignUp(toSignUp);
    setIsOtpStep(false);
    setError("");
    setSuccessMessage("");
    setOtpValue(["", "", "", "", "", ""]);
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      branch: "",
      semester: "1",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── OTP input box handlers ──
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValue];
    newOtp[index] = value.slice(-1);
    setOtpValue(newOtp);

    // Auto-advance
    if (value && index < 5) {
      const nextInput = document.getElementById(`login-otp-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit on 6th digit
    if (newOtp.every((digit) => digit !== "")) {
      handleOtpSubmit(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      const prevInput = document.getElementById(`login-otp-box-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtpValue(digits);
      handleOtpSubmit(pasted);
    }
  };

  // ── OTP Verification Submit ──
  const handleOtpSubmit = async (codeToVerify = null) => {
    const code = codeToVerify || otpValue.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (timeLeft <= 0) {
      setError("Login code expired — please request a new one.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await api.post("/auth/login/verify-otp", {
        email: formData.email.trim(),
        otp: code,
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
      });

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/student-dashboard", { state: { user: res.user } });
    } catch (err) {
      if (err.code === "OTP_LOCKED") {
        setError("Too many failed attempts. Please log in again.");
        setIsOtpStep(false);
      } else if (err.code === "OTP_EXPIRED") {
        setError("Login code expired. Please click Resend Code.");
      } else {
        setError(err.message || "Incorrect verification code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await api.post("/auth/login/resend-otp", {
        email: formData.email.trim(),
      });
      setSuccessMessage("A fresh verification code has been sent to your email.");
      setTimeLeft(res.expiresInSeconds || 900);
      setResendCooldown(30);
      setCanResend(false);
      setOtpValue(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("login-otp-box-0");
      if (firstInput) firstInput.focus();
    } catch (err) {
      setError(err.message || "Failed to resend code. Please wait before trying again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Form submission (Step 1 Login / Sign up) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOtpStep) {
      handleOtpSubmit();
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isSignUp) {
        // Client-side validation
        if (!formData.name || !formData.email || !formData.password || !formData.branch) {
          setError("All fields are required for sign up.");
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        // ── Sign up API call ──
        const res = await api.post("/auth/signup", {
          name: formData.name,
          email: formData.email.trim(),
          password: formData.password,
          branch: formData.branch,
          semester: formData.semester,
          role: "student",
        });

        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        navigate("/student-dashboard", { state: { user: res.user } });
      } else {
        // Login validation
        if (!formData.email || !formData.password) {
          setError("Email and password are required.");
          setLoading(false);
          return;
        }

        // ── Step 1 Login API call ──
        const res = await api.post("/auth/login", {
          email: formData.email.trim(),
          password: formData.password,
          isAdminLogin: false,
          deviceId: getDeviceId(),
          deviceName: getDeviceName(),
        });

        if (res.otpRequired) {
          setIsOtpStep(true);
          setMaskedEmail(res.email || formData.email.trim());
          setTimeLeft(res.expiresInSeconds || 900);
          setResendCooldown(30);
          setCanResend(false);
          setOtpValue(["", "", "", "", "", ""]);
          setTimeout(() => {
            const firstInput = document.getElementById("login-otp-box-0");
            if (firstInput) firstInput.focus();
          }, 100);
        } else {
          localStorage.setItem("token", res.token);
          localStorage.setItem("user", JSON.stringify(res.user));
          navigate("/student-dashboard", { state: { user: res.user } });
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="student"
      navRight={
        <a
          href="/admin"
          style={{
            fontSize: "13px",
            color: "rgba(148,163,184,0.40)",
            textDecoration: "none",
            cursor: "pointer",
            transition: "color 0.2s",
            userSelect: "none",
          }}
          onMouseEnter={(e) => (e.target.style.color = "rgba(148,163,184,0.80)")}
          onMouseLeave={(e) => (e.target.style.color = "rgba(148,163,184,0.40)")}
          title="Operator Portal"
        >
          श्री हरिवंश 💚
        </a>
      }
    >
      {/* ── Left: Brand ── */}
      <AuthBrand variant={isSignUp ? "student-signup" : "student-login"} />

      {/* ── Right: Form card ── */}
      <AuthCard>
        {isOtpStep ? (
          <>
            {/* OTP Verification Heading */}
            <h1 className="auth-card-heading">Verify it's you</h1>
            <p className="auth-card-sub">
              We've sent a 6-digit verification code to{" "}
              <strong style={{ color: "#34d399" }}>{maskedEmail}</strong>
            </p>

            {/* Global error */}
            {error && (
              <div className="auth-alert auth-alert--error" role="alert">
                {error}
              </div>
            )}

            {/* Global success */}
            {successMessage && (
              <div className="auth-alert auth-alert--success" role="status">
                <CheckCircle size={15} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1 }} />
                {successMessage}
              </div>
            )}

            {/* 6-box OTP Input */}
            <div style={{ marginTop: "24px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  margin: "16px 0 20px",
                }}
                onPaste={handleOtpPaste}
              >
                {otpValue.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`login-otp-box-${idx}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={loading || timeLeft <= 0}
                    autoFocus={idx === 0}
                    style={{
                      width: "48px",
                      height: "54px",
                      textAlign: "center",
                      fontSize: "22px",
                      fontWeight: "700",
                      borderRadius: "10px",
                      border: digit ? "2px solid #10b981" : "1.5px solid rgba(255,255,255,0.15)",
                      backgroundColor: "rgba(15, 23, 42, 0.6)",
                      color: "#ffffff",
                      outline: "none",
                      transition: "all 0.2s ease",
                      boxShadow: digit ? "0 0 12px rgba(16, 185, 129, 0.25)" : "none",
                    }}
                  />
                ))}
              </div>

              {/* 15-Minute Countdown */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: "13px",
                  color: timeLeft <= 60 ? "#ef4444" : "rgba(148, 163, 184, 0.9)",
                  fontWeight: "500",
                  marginBottom: "20px",
                }}
              >
                {timeLeft > 0 ? (
                  <>
                    Code expires in:{" "}
                    <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#fbbf24" }}>
                      {formatTime(timeLeft)}
                    </span>
                  </>
                ) : (
                  <span style={{ color: "#ef4444", fontWeight: "600" }}>
                    Code expired — please request a new one.
                  </span>
                )}
              </div>

              {/* Verify & Proceed Button */}
              <button
                type="button"
                onClick={() => handleOtpSubmit()}
                disabled={loading || timeLeft <= 0 || otpValue.some((d) => !d)}
                className="auth-btn auth-btn--student"
                style={{ width: "100%", marginBottom: "16px" }}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify &amp; Log In
                    <ArrowRight size={16} strokeWidth={2.5} className="auth-btn-arrow" />
                  </>
                )}
              </button>

              {/* Resend Code & Cooldown */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsOtpStep(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(148, 163, 184, 0.8)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "13px",
                    padding: 0,
                  }}
                >
                  Wrong email? Go back
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: canResend ? "#10b981" : "rgba(148, 163, 184, 0.4)",
                    cursor: canResend ? "pointer" : "not-allowed",
                    fontWeight: "600",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <RefreshCw size={13} strokeWidth={2} />
                  {canResend ? "Resend Code" : `Resend in ${resendCooldown}s`}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Heading */}
            <h1 className="auth-card-heading">
              {isSignUp ? "Create Student Account" : "Student Sign In"}
            </h1>
            <p className="auth-card-sub">
              {isSignUp
                ? "Fill in your details to get started."
                : "Welcome back! Please sign in to continue."}
            </p>

            {/* Global error */}
            {error && (
              <div className="auth-alert auth-alert--error" role="alert">
                {error}
              </div>
            )}

            {/* Global success */}
            {successMessage && (
              <div className="auth-alert auth-alert--success" role="status">
                <CheckCircle size={15} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1 }} />
                {successMessage}
              </div>
            )}

            {/* ── Form ── */}
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: error || successMessage ? "18px" : "0" }}
              noValidate
            >
              {/* ── Sign-Up only fields ── */}
              {isSignUp && (
                <>
                  <AuthInput
                    label="Full Name"
                    icon={<User size={16} strokeWidth={2} />}
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />

                  {/* Branch select */}
                  <div className="auth-field">
                    <label className="auth-label">Academic Branch</label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      required
                      className="auth-select"
                    >
                      <option value="">Select Branch...</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                      <option value="Computer Engineering/IT">Computer Engineering / IT</option>
                      <option value="Electronics & Communication">Electronics &amp; Communication</option>
                      <option value="Instrumentation & Control">Instrumentation &amp; Control</option>
                    </select>
                  </div>

                  {/* Semester select */}
                  <div className="auth-field">
                    <label className="auth-label">Semester</label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      className="auth-select"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s.toString()}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Email — shown in both modes */}
              <AuthInput
                label="Email Address"
                icon={<Mail size={16} strokeWidth={2} />}
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />

              {/* Password */}
              <PasswordInput
                label="Password"
                icon={<Lock size={16} strokeWidth={2} />}
                name="password"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                value={formData.password}
                onChange={handleInputChange}
              />

              {/* Confirm Password — sign-up only */}
              {isSignUp && (
                <PasswordInput
                  label="Confirm Password"
                  icon={<Lock size={16} strokeWidth={2} />}
                  name="confirmPassword"
                  required
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              )}

              {/* Forgot password — login only */}
              {!isSignUp && (
                <div className="auth-forgot">
                  {/* Preserve any existing forgot-password route if added later */}
                  <span className="auth-forgot-link" style={{ cursor: "default" }}>
                    Forgot Password?
                  </span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="auth-btn auth-btn--student"
                style={{ marginTop: "4px" }}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isSignUp ? "Create Account" : "Sign In"}
                    <ArrowRight size={16} strokeWidth={2.5} className="auth-btn-arrow" />
                  </>
                )}
              </button>
            </form>

            {/* ── Switch mode link ── */}
            <div style={{ marginTop: "24px" }}>
              <div className="auth-divider" style={{ marginBottom: "20px" }} />
              <p className="auth-switch">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => switchMode(false)}
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    New here?{" "}
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => switchMode(true)}
                    >
                      Create your account
                    </button>
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
