# Provider Setup Guide

This plugin is a bridge between Obsidian and powerful AI services. It uses **ASR Providers** for hearing (Speech-to-Text) and **LLM Providers** for thinking (Polishing & Cognitive Actions).

## 1. Transcription Providers (ASR)
*Used for: Voice Recording, Audio File Transcription.*

### Zhipu AI (智谱 AI)
*   **Website**: [open.bigmodel.cn](https://open.bigmodel.cn/)
*   **Model**: GLM-ASR-2512
*   **Why use it**: Very accurate for Mandarin/English mix; cost-effective.
*   **Setup**: Settings > Transcription > Zhipu AI > Paste API Key.

### Volcengine (火山引擎)
*   **Website**: [console.volcengine.com](https://console.volcengine.com/speech/service/8)
*   **Model**: Doubao (Flash Edition)
*   **Why use it**: Enterprise-grade recognition accuracy.
*   **Setup**: Settings > Transcription > VolcEngine > Enter App ID & Access Token.

---

## 2. Intelligence Providers (LLM)
*Used for: Text Polishing, Thinking Actions (Summarization, Debates, Reviews).*

You can choose different providers based on your needs (e.g., use a cheaper model for daily summaries and a smarter one for "Master Debates").

### OpenRouter (Recommended)
*   **Website**: [openrouter.ai](https://openrouter.ai/)
*   **Why use it**: Access to **Claude 3.5 Sonnet**, **GPT-4o**, **Llama 3** via a single key. No need to manage multiple subscriptions.
*   **Setup**:
    1.  Get Key from OpenRouter.
    2.  Settings > Intelligence > OpenRouter.
    3.  Model ID: `anthropic/claude-3.5-sonnet` (Recommended for complex thinking) or `google/gemini-flash-1.5` (For speed).

### Google Gemini
*   **Website**: [aistudio.google.com](https://aistudio.google.com/)
*   **Why use it**: **Free tier** available; massive context window (good for analyzing large folders of notes).
*   **Setup**: Settings > Intelligence > Google Gemini.

### DeepSeek (深度求索)
*   **Website**: [platform.deepseek.com](https://platform.deepseek.com/)
*   **Why use it**: Incredible reasoning capabilities (DeepSeek-V3/R1) at low cost. Excellent for "First Principles" and "Coding" tasks.
*   **Setup**: Settings > Intelligence > DeepSeek.

### Others
*   **OpenAI**: The standard. Good for general tasks.
*   **Anthropic (Direct)**: If you have a direct Claude API key.
*   **Minimax**: Good for creative writing / roleplay.
*   **Zhipu AI (GLM-4)**: Good general Chinese performance.

