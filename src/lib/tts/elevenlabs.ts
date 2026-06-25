import type { TTSProvider, TTSOptions, Voice } from "@/types";

/**
 * ElevenLabs TTS provider — premium voice quality.
 * Requires user's ElevenLabs API key.
 */
export class ElevenLabsProvider implements TTSProvider {
  readonly name = "ElevenLabs";
  readonly providerId = "elevenlabs";

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async synthesize(text: string, options?: TTSOptions): Promise<ArrayBuffer> {
    const voiceId = options?.voice ?? "21m00Tcm4TlvDq8ikWAM"; // Rachel (default)

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: options?.model ?? "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
    }

    return response.arrayBuffer();
  }

  async getVoices(): Promise<Voice[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": this.apiKey },
      });
      const data = (await response.json()) as {
        voices: Array<{ voice_id: string; name: string; labels?: Record<string, string> }>;
      };
      return data.voices.map((v) => ({
        id: v.voice_id,
        name: v.name,
        language: v.labels?.language ?? "en",
        provider: "elevenlabs",
      }));
    } catch {
      return [];
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
