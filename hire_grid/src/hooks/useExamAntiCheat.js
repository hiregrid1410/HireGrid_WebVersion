import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api";

export const VIOLATION_TYPES = {
  TAB_SWITCH: "tab_switch",
  SCREENSHOT_ATTEMPT: "screenshot_attempt",
  COPY_ATTEMPT: "copy_attempt",
};

export const VIOLATION_LABELS = {
  [VIOLATION_TYPES.TAB_SWITCH]: "Tab / App Switching",
  [VIOLATION_TYPES.SCREENSHOT_ATTEMPT]: "Screenshot Attempt",
  [VIOLATION_TYPES.COPY_ATTEMPT]: "Copy / Cut Attempt",
};

export const MAX_VIOLATIONS = 3;

/**
 * Clean Centralized Exam Anti-Cheat Hook
 * - Combined counter for Tab Switching, Screenshot, and Copy/Cut attempts (Max 3 total).
 * - Zero dependency on fullscreen.
 * - Strict submit lock preventing post-submission false warnings.
 * - Exact deduplication preventing double-firing on single actions (e.g. keydown + copy).
 */
export function useExamAntiCheat({
  activeModule,
  currentQuestionIndex,
  isFinished,
  isReviewing,
  attemptId,
  isPlacementAttempt = false,
  triggerWatermarkVisibility = () => { },
  onAutoSubmit = () => { },
  initialViolationCount = 0,
}) {
  const [warningCount, setWarningCount] = useState(initialViolationCount || 0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastViolationReason, setLastViolationReason] = useState("");

  // Synchronous guards to prevent any stale state or race conditions
  const warningCountRef = useRef(initialViolationCount || 0);
  const isSubmittingRef = useRef(false);
  const isSubmittedRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  const lastViolationTypeRef = useRef(null);

  // Keep ref synchronized with state
  useEffect(() => {
    warningCountRef.current = warningCount;
  }, [warningCount]);

  // Sync initial count if updated from server attempt response
  useEffect(() => {
    if (initialViolationCount !== undefined && initialViolationCount !== null) {
      setWarningCount(initialViolationCount);
      warningCountRef.current = initialViolationCount;
    }
  }, [initialViolationCount]);

  // Lock anti-cheat immediately when test finishes
  useEffect(() => {
    if (isFinished) {
      isSubmittedRef.current = true;
      setShowWarningModal(false);
    }
  }, [isFinished]);

  /**
   * Acquire submission lock synchronously.
   * Disables all anti-cheat triggers before network request / navigation begins.
   */
  const acquireSubmissionLock = useCallback(() => {
    if (isSubmittingRef.current || isSubmittedRef.current) {
      return false; // Already locked
    }
    isSubmittingRef.current = true;
    setShowWarningModal(false);
    return true;
  }, []);

  /**
   * Mark submission as completed.
   */
  const markSubmitted = useCallback(() => {
    isSubmittedRef.current = true;
    isSubmittingRef.current = false;
    setShowWarningModal(false);
  }, []);

  /**
   * Release lock if submission failed and user needs to retry.
   */
  const releaseSubmissionLock = useCallback(() => {
    isSubmittingRef.current = false;
  }, []);

  /**
   * Central Violation Registration Function
   */
  const registerViolation = useCallback(
    (type = VIOLATION_TYPES.TAB_SWITCH) => {
      // 1. Check synchronous locks
      if (isSubmittingRef.current || isSubmittedRef.current || isFinished) {
        return;
      }

      // 2. Deduplicate rapid / concurrent events for the same action within 1200ms
      const now = Date.now();
      if (now - lastViolationTimeRef.current < 1200) {
        return;
      }

      lastViolationTimeRef.current = now;
      lastViolationTypeRef.current = type;

      const reasonLabel = VIOLATION_LABELS[type] || "Security Violation";
      setLastViolationReason(reasonLabel);

      // Trigger dynamic watermark for security logging
      try {
        triggerWatermarkVisibility();
      } catch (e) { }

      // Log security event to backend
      const moduleTitle = activeModule?.title || "Exam Assessment";
      const qIndex = (currentQuestionIndex ?? -1) + 1;
      api.post("/security-logs", {
        eventType: type,
        details: isReviewing
          ? `Review mode violation (${reasonLabel}) on module "${moduleTitle}"`
          : `Assessment violation (${reasonLabel}) on module "${moduleTitle}" (Question ${qIndex})`,
      }).catch(() => { });

      // Increment combined violation counter
      const newCount = warningCountRef.current + 1;
      warningCountRef.current = newCount;
      setWarningCount(newCount);

      // Sync violation count with backend active attempt
      if (attemptId && !isReviewing) {
        const syncUrl = isPlacementAttempt
          ? `/placement-mission/attempts/${attemptId}/sync`
          : `/attempts/${attemptId}/sync`;
        api.post(syncUrl, { violationCount: newCount }).catch(() => { });
      }

      // If reached maximum allowed violations (3/3), lock and trigger auto-submit
      if (newCount >= MAX_VIOLATIONS) {
        isSubmittingRef.current = true;
        setShowWarningModal(true); // Show final submitting alert
        setTimeout(() => {
          onAutoSubmit("anti_cheat");
        }, 1200);
      } else {
        setShowWarningModal(true);
      }
    },
    [
      activeModule,
      currentQuestionIndex,
      isFinished,
      isReviewing,
      attemptId,
      isPlacementAttempt,
      triggerWatermarkVisibility,
      onAutoSubmit,
    ]
  );

  const dismissWarningModal = useCallback(() => {
    if (warningCountRef.current < MAX_VIOLATIONS) {
      setShowWarningModal(false);
    }
  }, []);

  const resetWarnings = useCallback(() => {
    setWarningCount(0);
    warningCountRef.current = 0;
    setShowWarningModal(false);
  }, []);

  // Event Listeners for Anti-Cheating
  useEffect(() => {
    const isSecurityActive =
      activeModule &&
      currentQuestionIndex >= 0 &&
      !isFinished &&
      !isReviewing;

    if (!isSecurityActive) return;

    // RULE 1: Tab / App Switching via visibilitychange
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === "hidden") {
        registerViolation(VIOLATION_TYPES.TAB_SWITCH);
      }
    };

    // RULE 2: Detectable Screenshot Keyboard Shortcuts (Best-effort detection)
    // Note: Normal web browsers cannot detect OS-level background screenshots (e.g. Snipping Tool),
    // but keyboard shortcut events exposed by the browser are captured here.
    const handleKeydown = (e) => {
      if (e.repeat) return; // Prevent key-hold repeat triggers

      const isPrintScreen = e.key === "PrintScreen";
      const isMacScreenshot =
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === "3" || e.key === "4" || e.key === "5" || e.key === "s" || e.key === "S");
      const isPrintShortcut = (e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P");

      if (isPrintScreen || isMacScreenshot || isPrintShortcut) {
        e.preventDefault();
        registerViolation(VIOLATION_TYPES.SCREENSHOT_ATTEMPT);
        return;
      }

      // Copy/Cut keyboard shortcuts (Ctrl+C / Cmd+C / Ctrl+X / Cmd+X)
      const isCopyCutKey = (e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C" || e.key === "x" || e.key === "X");
      if (isCopyCutKey) {
        e.preventDefault();
        registerViolation(VIOLATION_TYPES.COPY_ATTEMPT);
      }
    };

    // RULE 3: Copy / Cut event handlers
    const handleCopy = (e) => {
      e.preventDefault();
      registerViolation(VIOLATION_TYPES.COPY_ATTEMPT);
    };

    const handleCut = (e) => {
      e.preventDefault();
      registerViolation(VIOLATION_TYPES.COPY_ATTEMPT);
    };

    // Prevent context menu during exam without consuming a violation warning
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Attach listeners with clean references
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeydown, true);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeydown, true);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [activeModule, currentQuestionIndex, isFinished, isReviewing, registerViolation]);

  return {
    warningCount,
    showWarningModal,
    lastViolationReason,
    registerViolation,
    dismissWarningModal,
    resetWarnings,
    acquireSubmissionLock,
    markSubmitted,
    releaseSubmissionLock,
    isSubmittingRef,
    isSubmittedRef,
  };
}
