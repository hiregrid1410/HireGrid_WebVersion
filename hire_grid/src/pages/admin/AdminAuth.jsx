import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { api } from "../../lib/api";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthBrand from "../../components/auth/AuthBrand";
import AuthCard from "../../components/auth/AuthCard";
import AuthInput from "../../components/auth/AuthInput";
import PasswordInput from "../../components/auth/PasswordInput";
import SecurityIllustration from "../../components/auth/SecurityIllustration";

/* ─────────────────────────────────────────────────────────────
   AdminAuth
   Shared login for Admin and Content Manager roles.

   All existing authentication logic, API payloads, role
   detection, and redirect targets are preserved exactly.
   Only the presentation layer has been redesigned.
───────────────────────────────────────────────────────────── */
export default function AdminAuth() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Authentication handler (payload and redirects unchanged) ──
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email: email || "",
        password,
        isAdminLogin: true,
      });

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      if (res.user.role === "content_manager") {
        navigate("/content-manager-dashboard", {
          state: {
            role: "content_manager",
            name: res.user.name,
            id: res.user.id,
          },
        });
      } else {
        navigate("/admin-dashboard", {
          state: {
            role: "admin",
            name: res.user.name,
            id: !email || email.trim() === "" ? "super_admin" : res.user.id,
          },
        });
      }
    } catch (err) {
      console.error(err);
      setError("Access denied. Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="operator"
      navRight={
        <Link
          to="/"
          style={{
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.10em",
            color: "var(--auth-text-dim)",
            textDecoration: "none",
            textTransform: "uppercase",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "var(--auth-blue-light)")}
          onMouseLeave={(e) => (e.target.style.color = "var(--auth-text-dim)")}
        >
          ← Student Portal
        </Link>
      }
    >
      {/* ── Left: Operator Brand ── */}
      <AuthBrand variant="operator" />

      {/* ── Centre: Authentication Card ── */}
      <AuthCard>
        {/* Heading */}
        <h1 className="auth-card-heading">Operator Sign In</h1>
        <p className="auth-card-sub">
          Enter your authorized credentials to continue.
        </p>

        {/* Error alert */}
        {error && (
          <div className="auth-alert auth-alert--error" role="alert" style={{ marginBottom: "18px" }}>
            {error}
          </div>
        )}

        {/* ── Form ── */}
        <form
          onSubmit={handleEmailSignIn}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          noValidate
        >
          {/* Email — maps to `email` field in API payload */}
          <AuthInput
            label="Email Address"
            icon={<Mail size={16} strokeWidth={2} />}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="Enter operator email"
            variant="operator"
          />

          {/* Password — maps to `password` field in API payload */}
          <PasswordInput
            label="Security Passphrase"
            icon={<Lock size={16} strokeWidth={2} />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
            autoComplete="current-password"
            placeholder="Enter passphrase"
            variant="operator"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="auth-btn auth-btn--operator"
            style={{ marginTop: "4px" }}
          >
            {loading ? (
              <>
                <span className="auth-spinner" />
                Authenticating...
              </>
            ) : (
              <>
                Authenticate
                <ArrowRight size={16} strokeWidth={2.5} className="auth-btn-arrow" />
              </>
            )}
          </button>
        </form>

        {/* Bottom note */}
        <div style={{ marginTop: "24px" }}>
          <div className="auth-divider" style={{ marginBottom: "16px" }} />
          <p className="auth-switch" style={{ fontSize: "12px" }}>
            Need access?{" "}
            <span style={{ color: "var(--auth-text-dim)" }}>
              Contact Administrator
            </span>
          </p>
          <p
            style={{
              marginTop: "10px",
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--auth-text-dim)",
              letterSpacing: "0.06em",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Unauthorized access is logged and monitored.
          </p>
        </div>
      </AuthCard>

      {/* ── Right: Security Illustration ── */}
      <div className="auth-illustration">
        <SecurityIllustration />
      </div>
    </AuthLayout>
  );
}
