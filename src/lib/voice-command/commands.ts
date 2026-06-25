import type { VoiceCommandDefinition } from "@/types";

/**
 * Pre-defined voice commands with multilingual trigger phrases.
 */
export const VOICE_COMMANDS: VoiceCommandDefinition[] = [
  {
    command: "confirm",
    triggers: [
      "确认",
      "好的",
      "允许",
      "通过",
      "可以",
      "confirm",
      "yes",
      "approve",
      "allow",
      "okay",
      "ok",
    ],
    description: "Approve the pending permission request",
  },
  {
    command: "reject",
    triggers: [
      "拒绝",
      "不行",
      "不允许",
      "取消",
      "deny",
      "reject",
      "no",
      "cancel",
      "decline",
    ],
    description: "Deny the pending permission request",
  },
  {
    command: "skip",
    triggers: [
      "跳过",
      "下一个",
      "下一条",
      "skip",
      "next",
    ],
    description: "Skip the current broadcast",
  },
  {
    command: "pause",
    triggers: [
      "暂停",
      "停一下",
      "pause",
      "stop",
    ],
    description: "Pause the current playback",
  },
  {
    command: "resume",
    triggers: [
      "继续",
      "播放",
      "resume",
      "play",
      "continue",
    ],
    description: "Resume the paused playback",
  },
  {
    command: "repeat",
    triggers: [
      "再说一遍",
      "重复",
      "什么",
      "repeat",
      "what",
      "again",
    ],
    description: "Replay the current segment",
  },
];
