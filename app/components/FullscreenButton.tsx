import { useEffect, useState } from "react";
import { mdiFullscreen, mdiFullscreenExit } from "@mdi/js";
import MdiIcon from "./MdiIcon";

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="btn btn-circle fixed bottom-4 right-4 shadow-lg"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      <MdiIcon
        path={isFullscreen ? mdiFullscreenExit : mdiFullscreen}
        size={24}
      />
    </button>
  );
}
