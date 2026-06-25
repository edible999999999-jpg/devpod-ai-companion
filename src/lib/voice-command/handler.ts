import type { VoiceCommand } from "@/types";
import { VOICE_COMMANDS } from "./commands";

/**
 * Voice command handler — routes recognized text to the appropriate action.
 */
export interface CommandHandler {
  onConfirm: () => void;
  onReject: () => void;
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
  onRepeat: () => void;
}

/** Match spoken text to a command */
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

/** Execute a matched command */
export function executeCommand(
  command: VoiceCommand,
  handler: CommandHandler
): boolean {
  switch (command) {
    case "confirm":
      handler.onConfirm();
      return true;
    case "reject":
      handler.onReject();
      return true;
    case "skip":
      handler.onSkip();
      return true;
    case "pause":
      handler.onPause();
      return true;
    case "resume":
      handler.onResume();
      return true;
    case "repeat":
      handler.onRepeat();
      return true;
    case "unknown":
      console.log(`[VoiceCommand] Unrecognized command`);
      return false;
  }
}
