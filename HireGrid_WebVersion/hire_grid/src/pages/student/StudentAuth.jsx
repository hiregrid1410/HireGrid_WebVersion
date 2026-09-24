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

  // ── Form state (same field names as original) ──
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    branch: "",
    semester: "1",
  });

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
    setError("");
    setSuccessMessage("");
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

  // ── Form submission — unchanged API logic ──
  const handleSubmit = async (e) => {
    e.preventDefault();
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

        // ── Sign up API call (payload unchanged) ──
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

        // ── Login API call (payload unchanged) ──
        const res = await api.post("/auth/login", {
          email: formData.email.trim(),
          password: formData.password,
          isAdminLogin: false,
          deviceId: getDeviceId(),
          deviceName: getDeviceName(),
        });

        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        navigate("/student-dashboard", { state: { user: res.user } });
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
      </AuthCard>
    </AuthLayout>
  );
}
