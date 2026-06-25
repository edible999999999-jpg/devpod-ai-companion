import type { STTProvider } from "@/types";

/**
 * STT adapter registry. Similar to TTS, manages multiple STT providers.
 */

const providers = new Map<string, STTProvider>();
let activeProviderId = "web-speech";

export function registerSTTProvider(provider: STTProvider): void {
  providers.set(provider.providerId, provider);
}

export function setActiveSTTProvider(id: string): void {
  if (!providers.has(id)) {
    throw new Error(`STT provider "${id}" not registered`);
  }
  activeProviderId = id;
}

export function getActiveSTTProvider(): STTProvider | undefined {
  return providers.get(activeProviderId);
}
