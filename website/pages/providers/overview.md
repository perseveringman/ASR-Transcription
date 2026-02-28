---
title: Provider 概览
---

# Provider 概览

Aura 依赖两类外部 AI 服务，各司其职：

| 类型 | 职责 | 支持的 Provider |
|---|---|---|
| **转写（ASR）** | 将音频转为原始文字 | 智谱 AI、火山引擎豆包 |
| **智能（LLM）** | AI 润色、思维动作 | OpenRouter、Gemini、DeepSeek、OpenAI、Anthropic、Minimax、智谱 GLM |

**最低配置：** 只配置 ASR Provider，即可使用语音转写功能。配置 LLM Provider 后，AI 润色和思维动作功能全部解锁。

## 推荐组合

| 使用场景 | 推荐 ASR | 推荐 LLM |
|---|---|---|
| 日常短录音 + 轻量润色 | 智谱 AI | DeepSeek |
| 会议/网课长录音 + 深度分析 | 火山引擎豆包 | OpenRouter（Claude） |
| 预算有限 | 智谱 AI | Gemini（免费额度） |
