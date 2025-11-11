export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  if (!("wakeLock" in navigator)) {
    console.warn("Wake Lock API not supported");
    return null;
  }

  try {
    const wakeLock = await navigator.wakeLock.request("screen");
    return wakeLock;
  } catch (error) {
    console.error("Failed to request wake lock:", error);
    return null;
  }
}

export async function releaseWakeLock(
  wakeLock: WakeLockSentinel | null,
): Promise<void> {
  if (wakeLock) {
    await wakeLock.release();
  }
}
