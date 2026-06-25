import { useState, useCallback, useRef } from "react";
import type { AudioChunk, AudioQueueState } from "@/types";

/**
 * Manages the audio playback queue for TTS output.
 * In Phase 2, this will be connected to actual audio files via Tauri asset protocol.
 */
export function useAudioQueue() {
  const [queue, setQueue] = useState<AudioChunk[]>([]);
  const [state, setState] = useState<AudioQueueState>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const enqueue = useCallback((chunk: AudioChunk) => {
    setQueue((prev) => [...prev, chunk]);
  }, []);

  const play = useCallback(async () => {
    // Phase 2: Implement actual audio playback using Tauri asset protocol
    // const audioUrl = convertFileSrc(tempFilePath);
    // audioRef.current = new Audio(audioUrl);
    // await audioRef.current.play();
    setState("playing");
    console.log("[AudioQueue] Play (scaffold - not implemented yet)");
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState("paused");
  }, []);

  const skip = useCallback(() => {
    audioRef.current?.pause();
    setCurrentIndex((prev) => prev + 1);
    setState("idle");
  }, []);

  const clear = useCallback(() => {
    audioRef.current?.pause();
    setQueue([]);
    setCurrentIndex(0);
    setState("idle");
  }, []);

  return { queue, state, currentIndex, enqueue, play, pause, skip, clear };
}
