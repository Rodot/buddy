export class WakeLockService {
  private wakeLock: WakeLockSentinel | null = null;

  async request(): Promise<void> {
    if (!("wakeLock" in navigator)) {
      console.warn("Wake Lock API not supported");
      return;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake lock acquired");

      this.wakeLock.addEventListener("release", () => {
        console.log("Wake lock released");
        this.wakeLock = null;
      });
    } catch (error) {
      console.error("Failed to acquire wake lock:", error);
    }
  }

  async release(): Promise<void> {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log("Wake lock manually released");
      } catch (error) {
        console.error("Failed to release wake lock:", error);
      }
    }
  }

  isActive(): boolean {
    return this.wakeLock !== null;
  }
}
