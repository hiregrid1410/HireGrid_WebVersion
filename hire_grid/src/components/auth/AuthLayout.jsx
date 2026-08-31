import React from "react";
import "./auth.css";

/**
 * AuthLayout — Page shell for all 3 auth pages.
 *
 * Provides: dark background, grid pattern, sticky navbar, footer.
 *
 * Props:
 *   variant       {string}     'student' | 'operator'
 *   navRight      {ReactNode}  Optional right slot in the navbar
 *   children      {ReactNode}  Page body (main split content)
 */
export default function AuthLayout({ variant = "student", navRight, children }) {
  return (
    <div className="auth-page">
      {/* ── Navbar ── */}
      <nav className="auth-nav">
        <img
          src="/dark_logo.png"
          alt="HireGridX"
          className="auth-nav-logo"
        />
        <div className="auth-nav-badge">
          {navRight}
          <span className="auth-nav-badge-dot" />
          <span>SYSTEM ONLINE</span>
        </div>
      </nav>

      {/* ── Main body ── */}
      <main
        className={`auth-main ${
          variant === "operator" ? "auth-main--operator" : "auth-main--student"
        }`}
      >
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="auth-footer">
        <span>© HIREGRIDX · EXAM · LEARN · CONNECT · GROW</span>
        <span className="auth-footer-status">
          <span className="auth-footer-dot" />
          SYSTEM ONLINE
        </span>
      </footer>
    </div>
  );
}
