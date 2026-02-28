---
title: LLM Provider 配置
---

# LLM Provider 配置

LLM Provider 用于 **AI 润色** 和 **思维动作**。

## OpenRouter（推荐）

通过一个 Key 访问 Claude、GPT-4o、Llama 3 等多种模型。

1. 访问 [openrouter.ai](https://openrouter.ai/) 获取 API Key。
2. 设置 → Intelligence → **OpenRouter**，填入 Key。
3. 推荐模型 ID：
   - `anthropic/claude-3.5-sonnet`（复杂思维动作）
   - `google/gemini-flash-1.5`（速度优先）

## Google Gemini

- 官网：[aistudio.google.com](https://aistudio.google.com/)
- 有免费额度，上下文窗口大，适合分析大量笔记。

## DeepSeek（深度求索）

- 官网：[platform.deepseek.com](https://platform.deepseek.com/)
- DeepSeek-V3/R1 推理能力强，成本极低，适合"第一性原理"等深度分析。

## 其他 Provider

| Provider | 适用场景 |
|---|---|
| OpenAI | 通用任务，稳定可靠 |
| Anthropic（直连） | 有 Claude 直接 API Key 时使用 |
| Minimax | 创意写作、角色扮演 |
| 智谱 GLM-4 | 中文通用性能好 |
