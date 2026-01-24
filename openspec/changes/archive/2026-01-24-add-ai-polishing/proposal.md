# Add AI Polishing for Transcribed Text

## Why
Users often want their transcribed text to be cleaner and more readable. Raw speech-to-text often contains hesitation, repetition, and minor grammatical errors. By integrating an LLM (initially via OpenRouter) to polish the text, we can provide a much higher quality note-taking experience.

## What
- **New Feature**: "AI Polish" option for transcriptions.
- **Architecture**:
  - Abstract `LLMService` interface.
  - `OpenRouterLLMService` implementation.
  - `LLMServiceFactory`.
- **Configuration**:
  - LLM Provider selection (initially just OpenRouter).
  - API Key.
  - Model selection (default to a cheap/good one like `google/gemini-2.0-flash-exp:free` or `meta-llama/llama-3-8b-instruct`).
  - Custom System Prompt (with a sensible default).
- **Integration**:
  - Triggered after transcription completes.
  - New template variable `{{aiText}}`.
  - Fallback: If no template is used or `{{aiText}}` is missing, insert polished text after the raw text with a distinct header/label.

## How
1.  Define `LLMService` interface (authenticate, chat/complete).
2.  Implement `OpenRouterService`.
3.  Add settings for AI Polishing.
4.  Update `ASRPlugin` to orchestrate transcription -> polishing.
5.  Update `TextInserter` to handle the new content.

## Default System Prompt
"You are a helpful assistant that polishes transcribed speech. Your task is to fix typos, remove redundancies (like 'um', 'ah', repeated words), and ensure sentences are grammatically correct and flow smoothly. DO NOT change the original structure, meaning, or tone. DO NOT add any introductory or concluding remarks. Output ONLY the polished text."
