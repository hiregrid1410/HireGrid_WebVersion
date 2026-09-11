import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api";

export const VIOLATION_TYPES = {
  TAB_SWITCH: "tab_switch",
  SCREENSHOT_ATTEMPT: "screenshot_attempt",
  COPY_ATTEMPT: "copy_attempt",
  FULLSCREEN_EXIT: "fullscreen_exit",
};

export const VIOLATION_LABELS = {
  [VIOLATION_TYPES.TAB_SWITCH]: "Tab / App Switching",
  [VIOLATION_TYPES.SCREENSHOT_ATTEMPT]: "Screenshot Attempt",
  [VIOLATION_TYPES.COPY_ATTEMPT]: "Copy / Cut Attempt",
  [VIOLATION_TYPES.FULLSCREEN_EXIT]: "Exited Fullscreen",
};

export const MAX_VIOLATIONS = 3;

/**
 * Check if the browser currently has an active fullscreen element
 */
export const checkIsFullscreen = () => {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

/**
 * Clean Centralized Exam Anti-Cheat Hook
 * - Combined counter for Tab Switching, Screenshot, Copy/Cut, and Fullscreen Exit (Max 3 total).
 * - Fullscreen requirement support with user gesture integration and exit detection.
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
  const [lastViolationType, setLastViolationType] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(checkIsFullscreen());

  // Synchronous guards to prevent any stale state or race conditions
  const warningCountRef = useRef(initialViolationCount || 0);
  const isSubmittingRef = useRef(false);
  const isSubmittedRef = useRef(false);
  const isStartingExamRef = useRef(false);
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
   * Safe Fullscreen request helper
   */
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (checkIsFullscreen()) {
        setIsFullscreen(true);
        return true;
      }
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      return true;
    } catch (err) {
      console.warn("Fullscreen request not granted:", err);
      return false;
    }
  }, []);

  /**
   * Safe Fullscreen exit helper
   */
  const exitFullscreen = useCallback(async () => {
    try {
      if (checkIsFullscreen()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
      setIsFullscreen(false);
    } catch (e) {}
  }, []);

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
    exitFullscreen();
  }, [exitFullscreen]);

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
      if (
        isSubmittingRef.current ||
        isSubmittedRef.current ||
        isFinished ||
        isStartingExamRef.current
      ) {
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
      setLastViolationType(type);

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

  const dismissWarningModal = useCallback(async () => {
    if (warningCountRef.current < MAX_VIOLATIONS) {
      if (!checkIsFullscreen()) {
        await enterFullscreen();
      }
      setShowWarningModal(false);
    }
  }, [enterFullscreen]);

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

    // RULE 1: Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      const inFS = checkIsFullscreen();
      setIsFullscreen(inFS);

      if (!inFS) {
        // If user left fullscreen during an active exam (and not submitting)
        if (!isSubmittingRef.current && !isSubmittedRef.current && !isFinished && !isStartingExamRef.current) {
          registerViolation(VIOLATION_TYPES.FULLSCREEN_EXIT);
        }
      }
    };

    // RULE 2: Tab / App Switching via visibilitychange and window blur
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === "hidden") {
        console.warn("[AntiCheat] Tab switch detected via visibilitychange");
        registerViolation(VIOLATION_TYPES.TAB_SWITCH);
      }
    };

    const handleWindowBlur = () => {
      // Catch switching to devtools, another application window, or alt-tabbing on Linux
      if (!isSubmittingRef.current && !isSubmittedRef.current && !isFinished && !isStartingExamRef.current) {
        console.warn("[AntiCheat] Window blur detected (app/tab switch)");
        registerViolation(VIOLATION_TYPES.TAB_SWITCH);
      }
    };

    // RULE 3: Detectable Screenshot Keyboard Shortcuts (Best-effort detection)
    // Note: Normal web browsers cannot detect OS-level background screenshots (e.g. Snipping Tool),
    // but keyboard shortcut events exposed by the browser are captured here.
    const handleKeydown = (e) => {
      if (e.repeat) return; // Prevent key-hold repeat triggers

      const key = e.key || "";
      const isPrintScreen = key === "PrintScreen" || e.keyCode === 44 || e.which === 44;
      const isMacScreenshot =
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (key === "3" || key === "4" || key === "5" || key.toLowerCase() === "s");
      const isPrintShortcut = (e.ctrlKey || e.metaKey) && (key.toLowerCase() === "p");

      if (isPrintScreen || isMacScreenshot || isPrintShortcut) {
        e.preventDefault();
        e.stopPropagation();
        console.warn("[AntiCheat] Screenshot key detected:", key);
        registerViolation(VIOLATION_TYPES.SCREENSHOT_ATTEMPT);
        return;
      }

      // Copy/Cut keyboard shortcuts (Ctrl+C / Cmd+C / Ctrl+X / Cmd+X / Ctrl+Insert)
      const isCopyCutKey =
        ((e.ctrlKey || e.metaKey) && (key.toLowerCase() === "c" || key.toLowerCase() === "x")) ||
        (e.ctrlKey && key === "Insert");
      if (isCopyCutKey) {
        e.preventDefault();
        e.stopPropagation();
        console.warn("[AntiCheat] Copy/Cut key detected");
        registerViolation(VIOLATION_TYPES.COPY_ATTEMPT);
      }
    };

    // RULE 4: Copy / Cut event handlers
    const handleCopy = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.warn("[AntiCheat] Copy event intercepted");
      registerViolation(VIOLATION_TYPES.COPY_ATTEMPT);
    };

    const handleCut = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.warn("[AntiCheat] Cut event intercepted");
      registerViolation(VIOLATION_TYPES.COPY_ATTEMPT);
    };

    // Prevent context menu during exam without consuming a violation warning
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Attach listeners with capturing phase so child listeners cannot swallow them
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeydown, true);
    window.addEventListener("keyup", (e) => {
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        registerViolation(VIOLATION_TYPES.SCREENSHOT_ATTEMPT);
      }
    }, true);
    window.addEventListener("copy", handleCopy, true);
    window.addEventListener("cut", handleCut, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCut, true);
    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeydown, true);
      window.removeEventListener("copy", handleCopy, true);
      window.removeEventListener("cut", handleCut, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCut, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [activeModule, currentQuestionIndex, isFinished, isReviewing, registerViolation]);

  return {
    warningCount,
    showWarningModal,
    lastViolationReason,
    lastViolationType,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    registerViolation,
    dismissWarningModal,
    resetWarnings,
    acquireSubmissionLock,
    markSubmitted,
    releaseSubmissionLock,
    isSubmittingRef,
    isSubmittedRef,
    isStartingExamRef,
  };
}
