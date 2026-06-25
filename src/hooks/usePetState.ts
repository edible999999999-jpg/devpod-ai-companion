import { useState, useCallback } from "react";
import { canTransition } from "@/components/Pet/PetStates";
import type { PetState, HookEvent } from "@/types";

interface UsePetStateReturn {
  petState: PetState;
  setPetState: (newState: PetState) => void;
  currentEvent: HookEvent | null;
  setCurrentEvent: (event: HookEvent | null) => void;
}

/**
 * Manages the desktop pet's state machine.
 * Validates transitions and logs state changes.
 */
export function usePetState(): UsePetStateReturn {
  const [petState, setPetStateRaw] = useState<PetState>("idle");
  const [currentEvent, setCurrentEvent] = useState<HookEvent | null>(null);

  const setPetState = useCallback(
    (newState: PetState) => {
      setPetStateRaw((prev) => {
        if (!canTransition(prev, newState)) {
          console.warn(
            `[PetState] Invalid transition: ${prev} -> ${newState}`
          );
          return prev;
        }
        console.log(`[PetState] ${prev} -> ${newState}`);
        return newState;
      });
    },
    []
  );

  return { petState, setPetState, currentEvent, setCurrentEvent };
}
