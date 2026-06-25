import type { TTSProvider, TTSOptions, Voice } from "@/types";

/**
 * TTS adapter registry. Manages multiple TTS providers and selects the active one.
 *
 * To add a new TTS provider:
 * 1. Create a new file implementing TTSProvider (e.g., my-tts.ts)
 * 2. Register it here: registerProvider(new MyTTSProvider())
 * 3. Set it as active: setActiveProvider("my-tts")
 */

const providers = new Map<string, TTSProvider>();
let activeProviderId = "edge";

export function registerProvider(provider: TTSProvider): void {
  providers.set(provider.providerId, provider);
}

export function setActiveProvider(id: string): void {
  if (!providers.has(id)) {
    throw new Error(`TTS provider "${id}" not registered`);
  }
  activeProviderId = id;
}

export function getActiveProvider(): TTSProvider | undefined {
  return providers.get(activeProviderId);
}

export function getAvailableProviders(): TTSProvider[] {
  return Array.from(providers.values()).filter((p) => p.isAvailable());
}

export async function synthesize(
  text: string,
  options?: TTSOptions
): Promise<ArrayBuffer> {
  const provider = getActiveProvider();
  if (!provider) {
    throw new Error("No active TTS provider");
  }
  return provider.synthesize(text, options);
}

export async function getVoices(): Promise<Voice[]> {
  const provider = getActiveProvider();
  if (!provider) return [];
  return provider.getVoices();
}
