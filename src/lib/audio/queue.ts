import type { AudioChunk, AudioQueueState } from "@/types";
import { AudioPlayer } from "./player";

/**
 * Audio queue — manages ordered playback of TTS audio chunks.
 * Supports enqueue, play, pause, skip, and clear operations.
 */
export class AudioQueue {
  private queue: AudioChunk[] = [];
  private currentIndex = 0;
  private player: AudioPlayer;
  private state: AudioQueueState = "idle";

  constructor() {
    this.player = new AudioPlayer();
    this.player.setEndedCallback(() => this.playNext());
  }

  get length(): number {
    return this.queue.length - this.currentIndex;
  }

  get currentState(): AudioQueueState {
    return this.state;
  }

  enqueue(chunk: AudioChunk): void {
    this.queue.push(chunk);
    // Auto-play if this is the first chunk
    if (this.queue.length === 1 && this.state === "idle") {
      this.playCurrent();
    }
  }

  async play(): Promise<void> {
    if (this.state === "paused") {
      this.player.resume();
    } else {
      await this.playCurrent();
    }
  }

  pause(): void {
    this.player.pause();
    this.state = "paused";
  }

  skip(): void {
    this.player.stop();
    this.currentIndex++;
    if (this.currentIndex < this.queue.length) {
      this.playCurrent();
    } else {
      this.state = "ended";
    }
  }

  clear(): void {
    this.player.stop();
    this.queue = [];
    this.currentIndex = 0;
    this.state = "idle";
  }

  private async playCurrent(): Promise<void> {
    const chunk = this.queue[this.currentIndex];
    if (!chunk) {
      this.state = "ended";
      return;
    }
    this.state = "playing";
    try {
      await this.player.play(chunk.buffer);
    } catch (e) {
      console.error("[AudioQueue] Playback error:", e);
      this.playNext();
    }
  }

  private playNext(): void {
    this.currentIndex++;
    if (this.currentIndex < this.queue.length) {
      this.playCurrent();
    } else {
      this.state = "ended";
    }
  }
}
