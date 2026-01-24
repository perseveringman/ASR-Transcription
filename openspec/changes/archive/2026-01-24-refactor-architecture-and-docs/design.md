# System Design & Architecture

## Core Concepts

The plugin is transitioning from a simple command-runner to a modular **Audio Intelligence Platform**.

### 1. The Manager Pattern
Instead of `main.ts` instantiating services directly, we introduce "Managers" that hold the state and configuration for a domain.

*   **TranscriptionManager**:
    *   Responsible for initializing the correct `TranscriptionService` (Zhipu, Doubao, etc.).
    *   Handles constraints (file size, duration checks).
    *   Exposes `transcribe(audio)` method.
*   **LLMManager**:
    *   Responsible for initializing the correct `LLMService` (OpenAI, Gemini, etc.).
    *   Exposes `complete(messages)` and convenience methods like `process(text, systemPrompt)`.
    *   This separates the *capability* (Chat with AI) from the *feature* (Polish text).

### 2. Feature-based Workflow
Features (like "AI Polishing") consume these managers.

*   **Current Flow**: `ASRPlugin` -> `transcribe` -> `polish` -> `insert`.
*   **New Flow**: `WorkflowManager` (or simple logic in main) -> executes a pipeline.

### 3. Settings Organization
The UI should reflect the separation of concerns:

```text
[ General Settings ]
  - Audio Folder
  - Template

[ Transcription (ASR) ]
  - Provider: [ Zhipu | Volcengine ]
  - [Provider Specific Config...]

[ Intelligence (LLM) ]
  - Provider: [ OpenAI | Gemini | ... ]
  - [Provider Specific Config...]
  
[ Features ]
  - [x] Enable AI Polishing
      - System Prompt: ...
```

## Directory Structure Plan

```text
src/
├── main.ts
├── managers/              <-- NEW
│   ├── transcription-manager.ts
│   └── llm-manager.ts
├── services/
│   ├── audio-recorder.ts
│   ├── audio-converter.ts
│   ├── transcription/     <-- Existing providers
│   ├── llm/               <-- Existing providers
│   └── text-inserter.ts
├── ui/
│   ├── settings/          <-- Refactor setting tab components
│   └── ...
└── utils/
```
