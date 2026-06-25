import type { PetState } from "@/types";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useRef } from "react";

interface PetAvatarProps {
  state: PetState;
  onClick: () => void;
}

/**
 * Desktop pet avatar — compact, with native drag and click support.
 * 
 * Drag: mousedown on the pet initiates native window dragging via Tauri API.
 * Click: if the mouse didn't move during the drag attempt, it opens settings.
 */
export function PetAvatar({ state, onClick }: PetAvatarProps) {
  const dragStartPos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    wasDragged.current = false;

    try {
      await getCurrentWindow().startDragging();
      // If startDragging returns, the drag has ended.
      // Check if the mouse actually moved.
      // (If it was just a click, the OS drag didn't really start)
    } catch {
      // Drag might fail if the OS doesn't support it, that's fine
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    // Only count as click if mouse barely moved (< 5px)
    if (dx < 5 && dy < 5) {
      onClick();
    }
  };

  return (
    <div className="relative cursor-grab active:cursor-grabbing select-none">
      {/* Pulse rings for listening state */}
      {state === "listening" && (
        <>
          <div className="pulse-ring" />
          <div className="pulse-ring" style={{ animationDelay: "0.5s" }} />
        </>
      )}

      {/* Main pet body */}
      <div
        className={`
          w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-300 relative
          ${getPetStyle(state)}
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        role="button"
        tabIndex={0}
      >
        <span className="text-2xl select-none pointer-events-none">
          {getPetEmoji(state)}
        </span>

        {/* Waveform indicator for speaking state */}
        {state === "speaking" && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-0.5 items-end h-4 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="waveform-bar" />
            ))}
          </div>
        )}
      </div>

      {/* Waiting indicator (blinking dot) */}
      {state === "waiting" && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

function getPetStyle(state: PetState): string {
  switch (state) {
    case "idle":
      return "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm animate-float shadow-lg shadow-indigo-500/10";
    case "processing":
      return "bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm animate-pulse shadow-lg shadow-blue-500/20";
    case "speaking":
      return "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 backdrop-blur-sm shadow-lg shadow-indigo-500/20";
    case "listening":
      return "bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm shadow-lg shadow-emerald-500/20";
    case "waiting":
      return "bg-gradient-to-br from-amber-500/30 to-orange-500/30 backdrop-blur-sm shadow-lg shadow-amber-500/20";
    case "error":
      return "bg-gradient-to-br from-red-500/30 to-rose-500/30 backdrop-blur-sm shadow-lg shadow-red-500/20";
    default:
      return "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm";
  }
}

function getPetEmoji(state: PetState): string {
  switch (state) {
    case "idle":
      return "🐾";
    case "processing":
      return "🤔";
    case "speaking":
      return "🎙️";
    case "listening":
      return "👂";
    case "waiting":
      return "✋";
    case "error":
      return "😵";
    default:
      return "🐾";
  }
}
