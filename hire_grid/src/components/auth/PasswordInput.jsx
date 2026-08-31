import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * PasswordInput — AuthInput with show/hide toggle.
 *
 * Props:
 *   label     {string}     Field label
 *   icon      {ReactNode}  Left icon element
 *   error     {string}     Optional error message
 *   variant   {string}     'student' (default) | 'operator'
 *   All standard <input> props except `type` (managed internally)
 */
export default function PasswordInput({
  label,
  icon,
  error,
  variant = "student",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

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
          type={visible ? "text" : "password"}
          className={`auth-input auth-input--with-right ${
            icon ? "" : "!pl-[14px]"
          } ${variant === "operator" ? "auth-input--operator" : ""} ${
            error ? "auth-input--error" : ""
          }`}
        />
        <button
          type="button"
          className="auth-input-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff size={16} strokeWidth={2} />
          ) : (
            <Eye size={16} strokeWidth={2} />
          )}
        </button>
      </div>
      {error && <p className="auth-field-error">{error}</p>}
    </div>
  );
}
