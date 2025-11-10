export class FullscreenService {
  private exitListeners = new Set<() => void>();

  async request(): Promise<void> {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
    }
  }

  async exit(): Promise<void> {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Failed to exit fullscreen:", error);
      }
    }
  }

  isActive(): boolean {
    return document.fullscreenElement !== null;
  }

  onExit(callback: () => void): () => void {
    this.exitListeners.add(callback);

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Fullscreen was exited by user
        callback();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      this.exitListeners.delete(callback);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }
}
