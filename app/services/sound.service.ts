export class SoundService {
  private audio: HTMLAudioElement | null = null;
  private soundPath: string;

  constructor(soundPath: string) {
    this.soundPath = soundPath;
    // Only initialize audio in browser environment
    if (typeof window !== "undefined") {
      this.audio = new Audio(soundPath);
      this.audio.preload = "auto";
    }
  }

  play(): void {
    if (this.audio) {
      // Reset to start if already playing
      this.audio.currentTime = 0;
      this.audio.play().catch((error) => {
        console.error("Failed to play sound:", error);
      });
    }
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
}
