import type { STTProvider, STTOptions } from "@/types";

/**
 * OpenAI Whisper API provider — high accuracy, requires API key.
 */
export class WhisperProvider implements STTProvider {
  readonly name = "OpenAI Whisper";
  readonly providerId = "whisper";

  private apiKey: string;
  private baseUrl: string;
  private resultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private endCallback: (() => void) | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(apiKey: string, baseUrl = "https://api.openai.com/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async startListening(_options?: STTOptions): Promise<void> {
    // Record audio using MediaRecorder API
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      this.audioChunks.push(e.data);
    };

    this.mediaRecorder.start();
    console.log("[Whisper] Recording... (scaffold)");
  }

  async stopListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Not recording"));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });

        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");
          formData.append("model", "whisper-1");
          formData.append("language", "zh");

          const response = await fetch(
            `${this.baseUrl}/audio/transcriptions`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${this.apiKey}` },
              body: formData,
            }
          );

          const data = (await response.json()) as { text: string };
          const text = data.text ?? "";

          if (this.resultCallback) this.resultCallback(text, true);
          if (this.endCallback) this.endCallback();

          resolve(text);
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e));
          if (this.errorCallback) this.errorCallback(err);
          reject(err);
        }
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    });
  }

  onResult(callback: (text: string, isFinal: boolean) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.endCallback = callback;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
