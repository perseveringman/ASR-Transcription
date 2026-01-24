# Refactor Architecture and Documentation Overhaul

## Why
The current codebase has evolved rapidly. `main.ts` and `settings-tab.ts` are becoming monolithic. AI capabilities (LLM) are currently tightly coupled with the "Polishing" feature. To support future features like "Summarization", "Task Extraction", or "Translation", we need to decouple the AI service from the specific use case. Additionally, the documentation needs to be restructured to distinguish between "User Manual" (README) and "Developer/Architecture Guide" (docs/).

## What
1.  **Architecture Refactoring**:
    *   **Centralized Managers**: Create `TranscriptionManager` and `LLMManager` to handle provider instantiation and lifecycle.
    *   **Service Registry**: A central access point for services, removing logic from `ASRPlugin` class.
    *   **Settings Restructuring**: logically group settings in the UI (and eventually data structure) into:
        *   **General**: Storage paths, UI preferences.
        *   **Transcription (ASR)**: Provider selection and keys.
        *   **Intelligence (LLM)**: Global LLM provider configuration.
        *   **Features**: Toggle and configure specific workflows (e.g., "AI Polishing").
2.  **Documentation Overhaul**:
    *   **README.md**: Simplified. Focus on "What is this?", "How to install", "How to configure (Quick Start)".
    *   **docs/** folder:
        *   `architecture.md`: System design, data flow.
        *   `providers.md`: Detailed setup for each API (Zhipu, OpenAI, etc.).
        *   `development.md`: Guide for contributors.

## How
1.  Refactor `src/services/` to have clear boundaries.
2.  Create `src/managers/` for high-level orchestration.
3.  Rewrite `ASRSettingTab` to use sub-sections or a more modular approach.
4.  Move technical details from root `README.md` to `docs/`.
