import type { TranscriptEntry } from "@/types";

interface NotificationToastProps {
  entry: TranscriptEntry;
  onDismiss: () => void;
}

/**
 * Compact notification toast for non-critical events (Stop, TaskCompleted, Notification).
 * Shows briefly above the pet, auto-dismisses.
 */
export function NotificationToast({ entry, onDismiss }: NotificationToastProps) {
  const typeColors: Record<string, string> = {
    summary: "border-l-indigo-400",
    system: "border-l-slate-400",
    command: "border-l-emerald-400",
  };

  const typeIcons: Record<string, string> = {
    summary: "✅",
    system: "ℹ️",
    command: "🎤",
  };

  return (
    <div
      className={`
        toast-enter pointer-events-auto
        bg-slate-800/90 backdrop-blur-md rounded-lg
        border border-white/10 border-l-2 ${typeColors[entry.type] ?? "border-l-slate-400"}
        px-3 py-2 shadow-xl
        flex items-start gap-2
      `}
    >
      <span className="text-sm flex-shrink-0 mt-0.5">
        {typeIcons[entry.type] ?? "•"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-200 leading-snug truncate">
          {entry.text}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {entry.timestamp.toLocaleTimeString()}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-white text-xs flex-shrink-0 ml-1"
      >
        ×
      </button>
    </div>
  );
}
