import { useCallback, useRef } from "react";
import type { VoiceCommand } from "@/types";
import { VOICE_COMMANDS } from "@/lib/voice-command/commands";

interface UseVoiceCommandReturn {
  startListening: () => Promise<void>;
  stopListening: () => void;
  isListening: boolean;
  lastCommand: VoiceCommand | null;
}

/**
 * Voice command recognition hook.
 * In Phase 3, this will connect to Web Speech API or Whisper.
 */
export function useVoiceCommand(
  onCommand: (command: VoiceCommand, text: string) => void
): UseVoiceCommandReturn {
  const isListeningRef = useRef(false);
  const lastCommandRef = useRef<VoiceCommand | null>(null);

  const startListening = useCallback(async () => {
    if (isListeningRef.current) return;
    isListeningRef.current = true;

    // Phase 3: Implement actual STT
    // For scaffold, log a placeholder
    console.log("[VoiceCommand] Listening for commands... (scaffold)");

    // Future implementation:
    // const recognition = new webkitSpeechRecognition();
    // recognition.continuous = false;
    // recognition.lang = 'zh-CN';
    // recognition.onresult = (event) => {
    //   const text = event.results[0][0].transcript;
    //   const command = matchCommand(text);
    //   onCommand(command, text);
    // };
    // recognition.start();
  }, [onCommand]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    console.log("[VoiceCommand] Stopped listening");
  }, []);

  return {
    startListening,
    stopListening,
    isListening: isListeningRef.current,
    lastCommand: lastCommandRef.current,
  };
}

/** Match spoken text to a voice command */
export function matchCommand(text: string): VoiceCommand {
  const normalized = text.toLowerCase().trim();

  for (const def of VOICE_COMMANDS) {
    for (const trigger of def.triggers) {
      if (normalized.includes(trigger.toLowerCase())) {
        return def.command;
      }
    }
  }

  return "unknown";
}
