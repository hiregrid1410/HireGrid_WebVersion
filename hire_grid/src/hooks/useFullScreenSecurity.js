import { useState, useEffect } from "react";

export function useFullScreenSecurity({
  activeModule,
  currentQuestionIndex,
  isFinished,
  isReviewing,
  setWarningCount,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const isFullscreenSupported = () => {
    const elem = document.documentElement;
    return !!(elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen);
  };

  const enterFullscreen = () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } catch (e) {}
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (e) {}
  };

  const handleStartReview = () => {
    enterFullscreen();
    setWarningCount(0);
    setShowWarningModal(false);
  };

  const handleExitReview = () => {
    exitFullscreen();
    setShowWarningModal(false);
  };

  useEffect(() => {
    const isSecurityActive =
      activeModule &&
      ((currentQuestionIndex >= 0 && !isFinished && !isReviewing) || isReviewing);

    if (!isSecurityActive || !isFullscreenSupported()) return;

    // Check immediately after a small delay (to allow fullscreen transition)
    const checkTimer = setTimeout(() => {
      const inFS = !!(
        document.fullscreenElement || document.webkitFullscreenElement
      );
      setIsFullscreen(inFS);
      if (!inFS) {
        setShowWarningModal(true);
      }
    }, 1200);

    // Periodic check every 2.5 seconds to ensure they remain in fullscreen
    const interval = setInterval(() => {
      const inFS = !!(
        document.fullscreenElement || document.webkitFullscreenElement
      );
      setIsFullscreen(inFS);
      if (!inFS) {
        setShowWarningModal(true);
      }
    }, 2500);

    return () => {
      clearTimeout(checkTimer);
      clearInterval(interval);
    };
  }, [activeModule, currentQuestionIndex, isFinished, isReviewing]);

  return {
    isFullscreen,
    setIsFullscreen,
    showWarningModal,
    setShowWarningModal,
    enterFullscreen,
    exitFullscreen,
    isFullscreenSupported,
    handleStartReview,
    handleExitReview,
  };
}
