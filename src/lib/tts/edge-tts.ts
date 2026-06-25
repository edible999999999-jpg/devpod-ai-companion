import type { TTSProvider, TTSOptions, Voice } from "@/types";

/**
 * Edge TTS provider — free, no API key needed.
 * Uses Microsoft Edge's TTS service.
 *
 * In production, this will use the `edge-tts-universal` npm package
 * or call a local `openai-edge-tts` bridge server.
 *
 * For the scaffold, this is a placeholder interface.
 */
export class EdgeTTSProvider implements TTSProvider {
  readonly name = "Edge TTS (Free)";
  readonly providerId = "edge";

  async synthesize(text: string, _options?: TTSOptions): Promise<ArrayBuffer> {
    // TODO (Phase 2): Implement actual Edge TTS synthesis
    // Option A: Use edge-tts-universal npm package (server-side via Tauri command)
    // Option B: Call local openai-edge-tts bridge at http://localhost:5050/v1/audio/speech
    console.log(`[EdgeTTS] Synthesize: "${text.slice(0, 50)}..." (scaffold)`);
    throw new Error("Edge TTS not yet implemented — coming in Phase 2");
  }

  async getVoices(): Promise<Voice[]> {
    // Common Edge TTS voices (subset)
    return [
      { id: "zh-CN-XiaoxiaoNeural", name: "Xiaoxiao (中文)", language: "zh", gender: "female", provider: "edge" },
      { id: "zh-CN-YunxiNeural", name: "Yunxi (中文)", language: "zh", gender: "male", provider: "edge" },
      { id: "en-US-AriaNeural", name: "Aria (English)", language: "en", gender: "female", provider: "edge" },
      { id: "en-US-GuyNeural", name: "Guy (English)", language: "en", gender: "male", provider: "edge" },
      { id: "ja-JP-NanamiNeural", name: "Nanami (日本語)", language: "ja", gender: "female", provider: "edge" },
    ];
  }

  isAvailable(): boolean {
    // Edge TTS is always available (needs internet though)
    return true;
  }
}
