# Provider Setup Guide

This plugin supports multiple AI providers for both Speech-to-Text (Transcription) and Text Processing (Polishing).

## Transcription Providers (ASR)

### 1. Zhipu AI (智谱 AI)
*   **Website**: [open.bigmodel.cn](https://open.bigmodel.cn/)
*   **Model**: GLM-ASR-2512
*   **Setup**:
    1.  Register and create an API Key.
    2.  In Plugin Settings > Transcription, select "Zhipu AI".
    3.  Paste your API Key.

### 2. Volcengine (火山引擎)
*   **Website**: [console.volcengine.com](https://console.volcengine.com/speech/service/8)
*   **Model**: Doubao (Flash Edition)
*   **Setup**:
    1.  Create a "Speech Recognition" project in Volcengine console.
    2.  Get your **App ID** and **Access Token**.
    3.  In Plugin Settings > Transcription, select "VolcEngine doubao".
    4.  Enter App ID and Access Token.

---

## LLM Providers (AI Polishing)

### 1. OpenRouter
*   **Website**: [openrouter.ai](https://openrouter.ai/)
*   **Best for**: Accessing many models (GPT-4, Claude 3, Llama 3) with one key.
*   **Setup**:
    1.  Get an API Key from OpenRouter.
    2.  Select "OpenRouter" in Plugin Settings > Intelligence (LLM).
    3.  Enter Key and Model ID (e.g., `google/gemini-2.0-flash-exp:free`).

### 2. Google Gemini
*   **Website**: [aistudio.google.com](https://aistudio.google.com/)
*   **Setup**:
    1.  Get a free API Key.
    2.  Select "Google Gemini".
    3.  Enter Key. Model defaults to `gemini-2.0-flash`.

### 3. OpenAI
*   **Website**: [platform.openai.com](https://platform.openai.com/)
*   **Setup**:
    1.  Get an API Key.
    2.  Select "OpenAI".
    3.  Enter Key.
    *   **Proxy Support**: If you use a proxy, enter the Base URL (e.g., `https://api.yourproxy.com/v1`).

### 4. DeepSeek (深度求索)
*   **Website**: [platform.deepseek.com](https://platform.deepseek.com/)
*   **Setup**:
    1.  Get an API Key.
    2.  Select "DeepSeek".
    3.  Enter Key.

### 5. Zhipu AI (GLM-4)
*   **Website**: [open.bigmodel.cn](https://open.bigmodel.cn/)
*   **Note**: You can reuse your ASR key or use a different one.
*   **Setup**:
    1.  Select "Zhipu AI".
    2.  Enter API Key.

### 6. Anthropic (Claude)
*   **Website**: [console.anthropic.com](https://console.anthropic.com/)
*   **Setup**:
    1.  Get an API Key.
    2.  Select "Anthropic Claude".
    3.  Enter Key.

### 7. Minimax
*   **Website**: [platform.minimaxi.com](https://platform.minimaxi.com/)
*   **Setup**:
    1.  Get API Key and Group ID.
    2.  Select "Minimax".
    3.  Enter both values.
