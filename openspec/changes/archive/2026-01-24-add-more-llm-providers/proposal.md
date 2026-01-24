# Add Support for Multiple LLM Providers

## Why
Users have different preferences and subscriptions for LLM providers. Supporting major providers natively allows users to use their existing keys without relying solely on OpenRouter.

## What
Add support for the following LLM providers for the "AI Polish" feature:
1.  **Google Gemini**
2.  **OpenAI**
3.  **Anthropic (Claude)**
4.  **Zhipu AI** (Native LLM support, separate from ASR)
5.  **Minimax**
6.  **DeepSeek**

## How
1.  **Configuration**: Update `PluginSettings` to store API keys and Model IDs for each provider.
2.  **Service Abstraction**:
    *   Implement `GeminiLLMService`.
    *   Implement `AnthropicLLMService`.
    *   Implement `OpenAICompatibleLLMService` to handle OpenAI, DeepSeek, and Zhipu (as they share the same chat completion format).
    *   Implement `MinimaxLLMService` (if their API diverges significantly) or use the OpenAI compatible one if applicable.
3.  **UI**: Update the Settings tab to dynamically show relevant fields based on the selected provider.

## default Models
- **Gemini**: `gemini-2.0-flash`
- **OpenAI**: `gpt-4o-mini`
- **Claude**: `claude-3-5-sonnet-latest`
- **Zhipu**: `glm-4-flash`
- **DeepSeek**: `deepseek-chat`
- **Minimax**: `abab5.5-chat` (or latest available)
