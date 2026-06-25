# DevPod 🎙️

**Developer Podcast Pet** — 开发者的播客桌宠

一个开源的桌面伴侣应用，监听 AI 编程助手（Claude Code、Codex 等）的任务事件，将任务完成/确认请求自动总结为播客风格的语音播报，并支持语音交互。

## 为什么需要 DevPod？

当你用 Claude Code 或 Codex 做开发时，经常需要切回去看它的输出或者点击确认。DevPod 把这些信息变成语音"播客"直接讲给你听，你只需要动动嘴说"确认"或"拒绝"就行了。

**核心场景：**

- **任务完成播报** — Claude Code 完成一个任务后，语音播报摘要
- **语音确认** — 需要权限确认时，语音描述 + 语音说"确认/拒绝"
- **播客日报** — 定时汇总多个任务进展，生成一段"播客"播放

## 架构

```
Claude Code Hooks
       │
       ▼
  Hook Script ──→ DevPod Server (Rust/Tauri)
       │
       ▼
  EventBus ──→ LLM Summarizer ──→ Sentence Splitter
                                        │
                                        ▼
                                   TTS Engine (可插拔)
                                        │
                                        ▼
                                   Audio Queue ──→ Desktop Pet UI
                                                       │
                                                       ▼
                                                  STT Engine
                                                  (语音指令)
```

**技术栈：** Tauri v2 + React 18 + TypeScript + TailwindCSS + Rust

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [pnpm](https://pnpm.io/) 8+
- 系统依赖 (Tauri): 见 [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### 安装

```bash
# 克隆项目
git clone https://github.com/your-org/devpod.git
cd devpod

# 安装依赖
pnpm install

# 开发模式
pnpm tauri dev
```

### 配置 Claude Code Hooks

DevPod 启动后，在 Settings 面板点击 "Install Hooks" 即可自动配置。

或手动执行：

```bash
cd hooks
./install.sh
```

这会在 `~/.claude/settings.json` 中添加 DevPod 的 hook 配置。重启 Claude Code 后生效。

### 配置 API Key

DevPod 采用 BYOK (Bring Your Own Key) 模式，支持：

| 服务 | 用途 | 获取方式 |
|------|------|----------|
| OpenAI | TTS + STT + 摘要 | [platform.openai.com](https://platform.openai.com/api-keys) |
| ElevenLabs | 高品质语音 | [elevenlabs.io](https://elevenlabs.io) |
| Edge TTS | 免费语音（默认） | 无需 Key |

在 DevPod 的 Settings 面板中填入你的 API Key 即可。

## 项目结构

```
devpod/
├── src/                          # React + TypeScript 前端
│   ├── components/               # UI 组件
│   │   ├── Pet/                  # 桌宠 (形象 + 状态机 + 气泡)
│   │   ├── Overlay/              # 浮层 (确认面板 + 字幕)
│   │   └── Settings/             # 设置面板
│   ├── lib/                      # 核心逻辑
│   │   ├── tts/                  # TTS 适配器 (Edge/OpenAI/ElevenLabs)
│   │   ├── stt/                  # STT 适配器 (Web Speech/Whisper)
│   │   ├── summarizer/           # LLM 摘要引擎 + 分句器
│   │   ├── audio/                # 音频播放器 + 队列
│   │   └── voice-command/        # 语音指令识别
│   ├── hooks/                    # React hooks
│   └── types/                    # TypeScript 类型定义
├── src-tauri/                    # Rust 后端
│   └── src/
│       ├── hook_server.rs        # 本地 HTTP 服务器
│       ├── event_bus.rs          # 事件总线
│       ├── config.rs             # 配置管理
│       └── commands.rs           # Tauri IPC commands
├── hooks/                        # Claude Code Hook 脚本
│   ├── devpod-hook.sh            # Hook 入口
│   ├── install.sh                # 安装工具
│   └── uninstall.sh              # 卸载工具
└── docs/                         # 文档
```

## 语音方案

### TTS (文字转语音)

| 层级 | 方案 | 成本 | 说明 |
|------|------|------|------|
| 默认 | Edge TTS | 免费 | 微软 Edge 的 TTS，质量不错 |
| BYOK | OpenAI TTS | $15/M chars | tts-1 模型，自然流畅 |
| 高级 | ElevenLabs | 按量付费 | 最佳品质，支持声音克隆 |

### STT (语音转文字)

| 层级 | 方案 | 成本 | 说明 |
|------|------|------|------|
| 默认 | Web Speech API | 免费 | WebView 原生支持 |
| BYOK | OpenAI Whisper | $0.006/min | 高精度 |

## 语音指令

| 指令 | 触发词 | 动作 |
|------|--------|------|
| 确认 | "确认" / "好的" / "confirm" / "yes" | 批准权限请求 |
| 拒绝 | "拒绝" / "不行" / "reject" / "no" | 拒绝权限请求 |
| 跳过 | "跳过" / "下一个" / "skip" | 跳过当前播报 |
| 暂停 | "暂停" / "pause" | 暂停播放 |
| 继续 | "继续" / "resume" | 恢复播放 |
| 重播 | "再说一遍" / "repeat" | 重播当前段 |

## 路线图

### Phase 1: 骨架 ✅ (当前)
- Tauri v2 项目搭建
- 透明桌宠窗口
- Claude Code Hook 集成
- 事件总线 + 状态机
- Settings 面板
- 类型定义 + 适配器接口

### Phase 2: 语音管道
- [ ] Edge TTS 集成
- [ ] OpenAI TTS 集成
- [ ] LLM 摘要引擎 + 播客 prompt
- [ ] 流式分句 + 边生成边播报
- [ ] 音频队列播放器

### Phase 3: 语音交互
- [ ] Web Speech API 集成
- [ ] 语音指令识别
- [ ] PermissionRequest 语音确认
- [ ] 确认结果回传 Claude Code

### Phase 4: 完善体验
- [ ] 桌宠 Lottie 动画
- [ ] 系统托盘菜单
- [ ] 播报历史
- [ ] 播客日报汇总
- [ ] Codex CLI 适配
- [ ] 打包发布 (macOS / Windows / Linux)

## 贡献

欢迎共建！这是一个开源项目，目标是让所有 AI 编程助手的用户都能通过语音交互提升效率。

### 如何贡献

1. Fork 本仓库
2. 创建你的分支 (`git checkout -b feature/my-feature`)
3. 提交代码 (`git commit -m 'feat: add my feature'`)
4. 推送分支 (`git push origin feature/my-feature`)
5. 创建 Pull Request

### 开发规范

- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)
- 新增功能请附带类型定义
- TTS/STT 新功能请实现对应的 Provider 接口
- 测试你的改动确保 `pnpm tauri dev` 能正常启动

### 好的首次贡献

- 实现 Edge TTS provider (参考 `src/lib/tts/edge-tts.ts` 的接口)
- 添加更多语音指令触发词
- 设计桌宠的 Lottie 动画
- 翻译 UI 文本到其他语言
- 编写 Codex CLI 的 hook 适配

## License

[MIT](LICENSE) — 自由使用、修改和分发。
