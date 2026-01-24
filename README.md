# Obsidian ASR & Intelligence Plugin

An Obsidian plugin that transforms your voice into polished, actionable text. It combines powerful **Speech-to-Text (ASR)** engines with **Large Language Models (LLM)** to transcribe, polish, and organize your thoughts.

## Key Features

*   **🎙️ Voice Transcription**: Record directly in Obsidian or transcribe existing audio files.
*   **✨ AI Polishing**: Automatically fix typos, remove filler words ("um", "ah"), and improve readability using your favorite LLM.
*   **🔌 Multi-Provider Support**:
    *   **ASR**: Zhipu AI, Volcengine (Doubao).
    *   **LLM**: OpenAI, Gemini, Claude, DeepSeek, Minimax, Zhipu GLM, OpenRouter.
*   **📝 Flexible Insertion**: Insert text at cursor, end of document, or create a new note with a custom template.
*   **📄 Long Audio Support**: Automatically handles large files by chunking.

## Quick Start

1.  **Install**: Download `main.js`, `manifest.json`, `styles.css` to `.obsidian/plugins/asr-transcription/` or install via BRAT.
2.  **Configure Transcription**:
    *   Go to Settings -> ASR Transcription.
    *   Choose a provider (e.g., Zhipu AI) and enter your API Key.
3.  **Configure AI (Optional)**:
    *   Enable "AI Polishing".
    *   Choose an LLM Provider (e.g., OpenAI) and enter your API Key.
4.  **Use**:
    *   Open Command Palette (`Cmd/Ctrl + P`) -> "ASR: Open transcription modal".
    *   Or right-click an audio file -> "Transcribe audio".

## Documentation

*   [**Provider Setup Guide**](docs/providers.md): Detailed instructions on getting API keys for all supported services.
*   [**Architecture & Development**](docs/architecture.md): For developers who want to contribute or understand the code.

## License

MIT License