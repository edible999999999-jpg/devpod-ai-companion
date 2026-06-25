import type { PetState } from "@/types";

interface BubbleProps {
  state: PetState;
  text: string;
}

/**
 * Speech bubble above the pet avatar.
 * Shows contextual text based on the pet's current state.
 */
export function Bubble({ state, text }: BubbleProps) {
  if (!text || state === "idle") return null;

  return (
    <div className="mb-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl rounded-bl-sm max-w-[200px] text-center">
      <p className="text-xs text-white/90 leading-relaxed">{text}</p>
      {/* Bubble tail */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/10 backdrop-blur-md rotate-45" />
    </div>
  );
}
