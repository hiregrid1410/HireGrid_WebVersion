import React from "react";

/**
 * AuthInput — reusable dark-theme form input with left icon.
 *
 * Props:
 *   label     {string}     Field label (uppercase rendered)
 *   icon      {ReactNode}  Left icon element
 *   error     {string}     Optional error message to display below
 *   className {string}     Extra classes for the input element
 *   variant   {string}     'student' (default) | 'operator'
 *   All standard <input> props (type, name, value, onChange, placeholder, etc.)
 */
export default function AuthInput({
  label,
  icon,
  error,
  className = "",
  variant = "student",
  ...inputProps
}) {
  return (
    <div className="auth-field">
      {label && <label className="auth-label">{label}</label>}
      <div className="auth-input-wrap">
        {icon && (
          <span className="auth-input-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          {...inputProps}
          className={`auth-input${icon ? "" : " !pl-[14px]"} ${
            variant === "operator" ? "auth-input--operator" : ""
          } ${error ? "auth-input--error" : ""} ${className}`}
        />
      </div>
      {error && <p className="auth-field-error">{error}</p>}
    </div>
  );
}
