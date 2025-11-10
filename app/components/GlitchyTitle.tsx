import { useState, useEffect } from "react";

interface GlitchyTitleProps {
  normalText: string;
  glitchText: string;
  className?: string;
}

export default function GlitchyTitle({
  normalText,
  glitchText,
  className = "",
}: GlitchyTitleProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextGlitch = () => {
      // Random interval between 3-5 seconds
      const nextGlitchDelay = 3000 + Math.random() * 2000;
      timeoutId = setTimeout(() => {
        setIsGlitching(true);
        const glitchDuration = 300;
        setTimeout(() => {
          setIsGlitching(false);
          // Schedule the next glitch after returning to normal
          scheduleNextGlitch();
        }, glitchDuration);
      }, nextGlitchDelay);
    };

    scheduleNextGlitch();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <h1
      className={`text-6xl font-bold font-mono mb-2 pt-1 ${
        isGlitching ? "text-black bg-red-600" : "text-white"
      } ${className}`}
    >
      {isGlitching ? glitchText : normalText}
    </h1>
  );
}
