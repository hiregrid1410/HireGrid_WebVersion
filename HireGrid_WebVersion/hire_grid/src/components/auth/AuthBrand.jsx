import React from "react";
import { BookOpen, BarChart2, Target, Shield, Layout, Users } from "lucide-react";

/* Feature row data by variant */
const STUDENT_FEATURES = [
  {
    icon: <BookOpen size={16} strokeWidth={2} />,
    title: "Smart Learning",
    sub: "Adaptive study paths",
  },
  {
    icon: <Target size={16} strokeWidth={2} />,
    title: "Practice & Assessments",
    sub: "Real exam environment",
  },
  {
    icon: <BarChart2 size={16} strokeWidth={2} />,
    title: "Track Progress",
    sub: "Analyse performance",
  },
];

const SIGNUP_FEATURES = [
  {
    icon: <Layout size={16} strokeWidth={2} />,
    title: "Personalized Dashboard",
    sub: "Track your learning journey",
  },
  {
    icon: <BookOpen size={16} strokeWidth={2} />,
    title: "Expert Content",
    sub: "Curated by industry professionals",
  },
  {
    icon: <Target size={16} strokeWidth={2} />,
    title: "Placement Missions",
    sub: "Real company assessments",
  },
  {
    icon: <Shield size={16} strokeWidth={2} />,
    title: "Secure & Reliable",
    sub: "Your data is always protected",
  },
];

const OPERATOR_FEATURES = [
  {
    icon: <Shield size={16} strokeWidth={2} />,
    title: "System Control",
    sub: "Manage platform",
  },
  {
    icon: <Layout size={16} strokeWidth={2} />,
    title: "Content Management",
    sub: "Organise & publish",
  },
  {
    icon: <Users size={16} strokeWidth={2} />,
    title: "Access Management",
    sub: "Secure & audit",
  },
];

/**
 * AuthBrand — Left panel with logo, hero text, description, feature rows.
 *
 * Props:
 *   variant  {string}  'student-login' | 'student-signup' | 'operator'
 */
export default function AuthBrand({ variant = "student-login" }) {
  const isOperator = variant === "operator";
  const isSignup = variant === "student-signup";

  const features = isOperator
    ? OPERATOR_FEATURES
    : isSignup
    ? SIGNUP_FEATURES
    : STUDENT_FEATURES;

  const badge = isOperator ? "OPERATOR ACCESS" : "STUDENT ACCESS";
  const badgeClass = isOperator
    ? "auth-brand-badge auth-brand-badge--operator"
    : "auth-brand-badge";
  const iconClass = isOperator
    ? "auth-feature-icon auth-feature-icon--operator"
    : "auth-feature-icon";

  const description = isOperator
    ? "Authorized access for platform administration and content management."
    : isSignup
    ? "Create your account to access learning modules, practice tests, placement missions, and more."
    : "Access learning modules, assessments, placement missions, and your personalized career dashboard.";

  return (
    <div className="auth-brand">
      {/* Logo */}
      <img
        src="/dark_logo.png"
        alt="HireGridX"
        className="auth-brand-logo"
        style={{ height: "40px", width: "auto", objectFit: "contain", objectPosition: "left center" }}
      />

      {/* Badge */}
      <div className={badgeClass}>
        <span className="auth-brand-badge-dot" />
        {badge}
      </div>

      {/* Hero heading */}
      <div className="auth-hero">
        <span className="auth-hero-line auth-hero-line--white">ENGINEERING</span>
        <span
          className={
            isOperator
              ? "auth-hero-line auth-hero-line--blue"
              : "auth-hero-line auth-hero-line--green"
          }
        >
          COMMAND
        </span>
        <span className="auth-hero-line auth-hero-line--lime">CENTER</span>
      </div>

      {/* Description */}
      <p className="auth-brand-desc">{description}</p>

      {/* Feature rows */}
      <div className="auth-features">
        {features.map((f) => (
          <div className="auth-feature-item" key={f.title}>
            <span className={iconClass}>{f.icon}</span>
            <div>
              <p className="auth-feature-text-title">{f.title}</p>
              <p className="auth-feature-text-sub">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
