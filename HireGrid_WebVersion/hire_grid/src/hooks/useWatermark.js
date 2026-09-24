import { useState, useEffect } from "react";

export function useWatermark({
  activeModule,
  currentQuestionIndex,
  isFinished,
  isReviewing,
}) {
  const [watermarkOffset, setWatermarkOffset] = useState({ x: 0, y: 0 });
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.012);

  const triggerWatermarkVisibility = () => {
    setWatermarkOpacity(0.35);
    setTimeout(() => {
      setWatermarkOpacity(0.012);
    }, 15000);
  };

  useEffect(() => {
    const isTestActive = activeModule && currentQuestionIndex >= 0 && !isFinished && !isReviewing;
    if (isTestActive) {
      const interval = setInterval(() => {
        setWatermarkOffset({
          x: Math.floor(Math.random() * 40) - 20,
          y: Math.floor(Math.random() * 40) - 20,
        });
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [activeModule, currentQuestionIndex, isFinished, isReviewing]);

  return {
    watermarkOffset,
    watermarkOpacity,
    triggerWatermarkVisibility,
  };
}
