import type { AudioQueueState } from "@/types";

/**
 * Audio player — plays audio buffers using HTML5 Audio API.
 * In Phase 2, will use Tauri asset protocol for local files.
 */
export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private onStateChange: ((state: AudioQueueState) => void) | null = null;
  private onEnded: (() => void) | null = null;

  setStateCallback(cb: (state: AudioQueueState) => void): void {
    this.onStateChange = cb;
  }

  setEndedCallback(cb: () => void): void {
    this.onEnded = cb;
  }

  async play(buffer: ArrayBuffer): Promise<void> {
    // Convert ArrayBuffer to blob URL for playback
    const blob = new Blob([buffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);

    this.audio = new Audio(url);
    this.audio.onplay = () => this.onStateChange?.("playing");
    this.audio.onpause = () => this.onStateChange?.("paused");
    this.audio.onended = () => {
      URL.revokeObjectURL(url);
      this.onEnded?.();
    };

    this.onStateChange?.("playing");
    await this.audio.play();
  }

  pause(): void {
    this.audio?.pause();
  }

  resume(): void {
    this.audio?.play();
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.onStateChange?.("idle");
  }
}
