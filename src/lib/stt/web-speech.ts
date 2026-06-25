import type { STTProvider, STTOptions } from "@/types";

/**
 * Web Speech API provider — free, built into WebView.
 * Uses webkitSpeechRecognition for real-time speech-to-text.
 */
export class WebSpeechProvider implements STTProvider {
  readonly name = "Web Speech API";
  readonly providerId = "web-speech";

  // Phase 3: Will be used when Web Speech API is fully integrated
  private _recognition: unknown = null;
  private _resultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private _errorCallback: ((error: Error) => void) | null = null;
  private _endCallback: (() => void) | null = null;

  async startListening(options?: STTOptions): Promise<void> {
    // TODO (Phase 3): Implement Web Speech API
    // const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    // this.recognition = new SpeechRecognition();
    // this.recognition.continuous = options?.continuous ?? false;
    // this.recognition.interimResults = options?.interimResults ?? true;
    // this.recognition.lang = options?.language ?? 'zh-CN';
    // this.recognition.onresult = (event) => { ... };
    // this.recognition.start();
    console.log(`[WebSpeech] Start listening (scaffold, lang=${options?.language ?? "zh-CN"})`);
  }

  async stopListening(): Promise<string> {
    // this.recognition?.stop();
    console.log("[WebSpeech] Stop listening (scaffold)");
    return "";
  }

  onResult(callback: (text: string, isFinal: boolean) => void): void {
    this._resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this._errorCallback = callback;
  }

  onEnd(callback: () => void): void {
    this._endCallback = callback;
  }

  isAvailable(): boolean {
    // Check if Web Speech API is available in the WebView
    return typeof window !== "undefined" && "webkitSpeechRecognition" in window;
  }
}
