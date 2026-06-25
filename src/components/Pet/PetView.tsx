import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Bubble } from "./Bubble";
import { usePetState } from "../../hooks/usePetState";
import { useEventBus } from "../../hooks/useEventBus";

/**
 * PetView — the desktop pet display for the main window.
 * 
 * - Entire window is draggable (via startDragging on mousedown)
 * - Single click opens settings window
 * - Events trigger system notifications (not in-window toasts)
 */
export function PetView() {
  const { petState, setPetState } = usePetState();
  const { latestEvent } = useEventBus();
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Handle events: update pet state + send system notification with rich content
  useEffect(() => {
    if (!latestEvent) return;

    const eventName = latestEvent.hook_event_name;
    const payload = latestEvent.payload as Record<string, unknown>;

    if (eventName === "PermissionRequest") {
      setPetState("waiting");
      const toolName = (payload.tool_name as string) ?? "Unknown";
      const toolInput = (payload.tool_input as Record<string, unknown>) ?? {};

      // Build detailed description based on tool type
      let detail = "";
      if (toolName === "Bash" && toolInput.command) {
        detail = `\n命令: ${(toolInput.command as string).slice(0, 120)}`;
      } else if (
        (toolName === "Write" || toolName === "Edit" || toolName === "Read") &&
        toolInput.file_path
      ) {
        detail = `\n文件: ${(toolInput.file_path as string).split("/").pop()}`;
      } else if (Object.keys(toolInput).length > 0) {
        detail = `\n${JSON.stringify(toolInput).slice(0, 100)}`;
      }

      invoke("send_notification", {
        title: `⚠️ ${toolName} 需要确认`,
        body: `Claude Code 请求执行 ${toolName}${detail}\n点击桌宠来确认或拒绝`,
      });
    } else if (eventName === "Stop" || eventName === "TaskCompleted") {
      setPetState("processing");
      const cwd = (latestEvent.cwd as string) ?? "";
      const projectName = cwd.split("/").pop() || "unknown";

      invoke("send_notification", {
        title: `✅ 任务完成`,
        body: `项目: ${projectName}\n会话: ${latestEvent.session_id.slice(0, 8)}...`,
      });
      setTimeout(() => setPetState("idle"), 3000);
    } else if (eventName === "Notification") {
      const message = (payload.message as string) ?? "";
      const title = (payload.title as string) ?? "DevPod 通知";

      invoke("send_notification", {
        title,
        body: message || "收到一条通知",
      });
    } else if (eventName === "PreToolUse" || eventName === "PostToolUse") {
      const toolName = (payload.tool_name as string) ?? "";
      const action = eventName === "PreToolUse" ? "正在使用" : "已完成";

      invoke("send_notification", {
        title: `🔧 ${toolName}`,
        body: `Claude Code ${action} ${toolName}`,
      });
    }
  }, [latestEvent]);

  // Drag: initiate native window drag on any mousedown
  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    try {
      await getCurrentWindow().startDragging();
    } catch {
      // Drag might fail, that's OK
    }
  }, []);

  // Click: if mouse barely moved, toggle settings window
  const handleMouseUp = useCallback(async (e: React.MouseEvent) => {
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    if (dx < 5 && dy < 5) {
      await invoke("toggle_settings");
    }
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <Bubble state={petState} text={getBubbleText(petState)} />
      <PetBody state={petState} />
    </div>
  );
}

// ===== Pet body (visual element) =====

function PetBody({ state }: { state: string }) {
  return (
    <div className="relative">
      {/* Pulse rings for listening */}
      {state === "listening" && (
        <>
          <div className="pulse-ring" />
          <div className="pulse-ring" style={{ animationDelay: "0.5s" }} />
        </>
      )}

      {/* Main body */}
      <div
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-300 relative
          ${getPetStyle(state)}
        `}
      >
        <span className="text-xl select-none pointer-events-none">
          {getPetEmoji(state)}
        </span>

        {/* Waveform for speaking */}
        {state === "speaking" && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5 items-end h-3 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="waveform-bar" />
            ))}
          </div>
        )}
      </div>

      {/* Waiting dot */}
      {state === "waiting" && (
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

function getBubbleText(state: string): string {
  switch (state) {
    case "processing": return "...";
    case "waiting": return "!";
    default: return "";
  }
}

function getPetStyle(state: string): string {
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

function getPetEmoji(state: string): string {
  switch (state) {
    case "idle": return "🐾";
    case "processing": return "🤔";
    case "speaking": return "🎙️";
    case "listening": return "👂";
    case "waiting": return "✋";
    case "error": return "😵";
    default: return "🐾";
  }
}
