import type { TTSProvider, TTSOptions, Voice } from "@/types";

/**
 * OpenAI TTS provider (tts-1 / tts-1-hd / gpt-4o-mini-tts).
 * Requires user's OpenAI API key.
 */
export class OpenAITTSProvider implements TTSProvider {
  readonly name = "OpenAI TTS";
  readonly providerId = "openai";

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = "https://api.openai.com/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async synthesize(text: string, options?: TTSOptions): Promise<ArrayBuffer> {
    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options?.model ?? "tts-1",
        input: text,
        voice: options?.voice ?? "alloy",
        speed: options?.speed ?? 1.0,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS error: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  async getVoices(): Promise<Voice[]> {
    return [
      { id: "alloy", name: "Alloy", language: "en", provider: "openai" },
      { id: "ash", name: "Ash", language: "en", provider: "openai" },
      { id: "coral", name: "Coral", language: "en", provider: "openai" },
      { id: "echo", name: "Echo", language: "en", gender: "male", provider: "openai" },
      { id: "fable", name: "Fable", language: "en", provider: "openai" },
      { id: "nova", name: "Nova", language: "en", gender: "female", provider: "openai" },
      { id: "onyx", name: "Onyx", language: "en", gender: "male", provider: "openai" },
      { id: "sage", name: "Sage", language: "en", provider: "openai" },
      { id: "shimmer", name: "Shimmer", language: "en", gender: "female", provider: "openai" },
    ];
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
