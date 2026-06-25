import { useState, useEffect } from "react";
import type { AppConfig } from "@/types";

interface SettingsPanelProps {
  onClose: () => void;
}

/**
 * Settings panel for configuring DevPod.
 * Includes API key management, voice selection, and hook installation.
 */
export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "voice" | "hooks">(
    "general"
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load config on mount
  useEffect(() => {
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const cfg = (await invoke("get_config")) as AppConfig;
        setConfig(cfg);
      } catch (e) {
        console.error("Failed to load config:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_config", { newConfig: config });
      setMessage({ type: "success", text: "Settings saved!" });
    } catch (e) {
      setMessage({ type: "error", text: `Failed to save: ${e}` });
    } finally {
      setSaving(false);
    }
  };

  const handleInstallHooks = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = (await invoke("install_hooks")) as string;
      setMessage({ type: "success", text: result });
    } catch (e) {
      setMessage({ type: "error", text: `Hook install failed: ${e}` });
    }
  };

  const handleUninstallHooks = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = (await invoke("uninstall_hooks")) as string;
      setMessage({ type: "success", text: result });
    } catch (e) {
      setMessage({ type: "error", text: `Hook uninstall failed: ${e}` });
    }
  };

  if (loading || !config) {
    return (
      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-lg flex items-center justify-center no-drag z-50">
        <p className="text-slate-400 text-sm">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-lg flex flex-col no-drag z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(["general", "voice", "hooks"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "text-indigo-300 border-b-2 border-indigo-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {activeTab === "general" && (
          <GeneralTab config={config} onChange={setConfig} />
        )}
        {activeTab === "voice" && (
          <VoiceTab config={config} onChange={setConfig} />
        )}
        {activeTab === "hooks" && (
          <HooksTab
            onInstall={handleInstallHooks}
            onUninstall={handleUninstallHooks}
          />
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-2 text-xs ${
            message.type === "success"
              ? "text-emerald-300 bg-emerald-500/10"
              : "text-red-300 bg-red-500/10"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// --- Sub-components ---

function GeneralTab({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (c: AppConfig) => void;
}) {
  return (
    <>
      {/* OpenAI API Key */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          OpenAI API Key
        </label>
        <input
          type="password"
          value={config.api_keys.openai ?? ""}
          onChange={(e) =>
            onChange({
              ...config,
              api_keys: { ...config.api_keys, openai: e.target.value || undefined },
            })
          }
          placeholder="sk-..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <p className="text-[10px] text-slate-500 mt-1">
          Used for TTS (tts-1), STT (Whisper), and summarization
        </p>
      </div>

      {/* ElevenLabs API Key */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          ElevenLabs API Key
        </label>
        <input
          type="password"
          value={config.api_keys.elevenlabs ?? ""}
          onChange={(e) =>
            onChange({
              ...config,
              api_keys: { ...config.api_keys, elevenlabs: e.target.value || undefined },
            })
          }
          placeholder="Your ElevenLabs key"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <p className="text-[10px] text-slate-500 mt-1">
          Optional, for premium voice quality
        </p>
      </div>

      {/* Language */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Language</label>
        <select
          value={config.ui.language}
          onChange={(e) =>
            onChange({
              ...config,
              ui: { ...config.ui, language: e.target.value as "zh" | "en" },
            })
          }
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>
    </>
  );
}

function VoiceTab({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (c: AppConfig) => void;
}) {
  return (
    <>
      {/* TTS Provider */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          TTS Provider
        </label>
        <select
          value={config.tts.provider}
          onChange={(e) =>
            onChange({
              ...config,
              tts: { ...config.tts, provider: e.target.value as AppConfig["tts"]["provider"] },
            })
          }
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="edge">Edge TTS (Free)</option>
          <option value="openai">OpenAI TTS</option>
          <option value="elevenlabs">ElevenLabs</option>
        </select>
      </div>

      {/* Voice name */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Voice</label>
        <input
          type="text"
          value={config.tts.voice}
          onChange={(e) =>
            onChange({ ...config, tts: { ...config.tts, voice: e.target.value } })
          }
          placeholder="Voice name / ID"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <p className="text-[10px] text-slate-500 mt-1">
          e.g. "alloy" (OpenAI), "zh-CN-XiaoxiaoNeural" (Edge)
        </p>
      </div>

      {/* Speed */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Speed: {config.tts.speed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={config.tts.speed}
          onChange={(e) =>
            onChange({
              ...config,
              tts: { ...config.tts, speed: parseFloat(e.target.value) },
            })
          }
          className="w-full accent-indigo-500"
        />
      </div>

      {/* STT Provider */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          STT Provider
        </label>
        <select
          value={config.stt.provider}
          onChange={(e) =>
            onChange({
              ...config,
              stt: { ...config.stt, provider: e.target.value as AppConfig["stt"]["provider"] },
            })
          }
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="web-speech">Web Speech API (Free)</option>
          <option value="whisper">OpenAI Whisper</option>
        </select>
      </div>
    </>
  );
}

function HooksTab({
  onInstall,
  onUninstall,
}: {
  onInstall: () => void;
  onUninstall: () => void;
}) {
  return (
    <>
      <div className="bg-slate-800/50 rounded-lg p-3">
        <h4 className="text-xs font-medium text-white mb-2">
          Claude Code Hook Integration
        </h4>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          DevPod listens to Claude Code events by installing hook scripts into{" "}
          <code className="text-indigo-300">~/.claude/settings.json</code>. When
          Claude Code completes a task or needs confirmation, DevPod will
          receive the event and generate a podcast-style voice summary.
        </p>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Hook events monitored:{" "}
          <code className="text-amber-300">PermissionRequest</code>,{" "}
          <code className="text-emerald-300">Stop</code>,{" "}
          <code className="text-blue-300">TaskCompleted</code>,{" "}
          <code className="text-purple-300">Notification</code>
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onInstall}
          className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30"
        >
          Install Hooks
        </button>
        <button
          onClick={onUninstall}
          className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
        >
          Uninstall Hooks
        </button>
      </div>

      <div className="bg-slate-800/30 rounded-lg p-3 mt-2">
        <p className="text-[10px] text-slate-500">
          After installing hooks, restart Claude Code for changes to take
          effect. You can verify by running <code>/hooks</code> inside Claude
          Code.
        </p>
      </div>
    </>
  );
}
