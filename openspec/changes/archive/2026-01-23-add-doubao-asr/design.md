## Context
The current transcription logic is tightly coupled with Zhipu's constraints. We need to support Volcengine Doubao and potentially other providers (OpenAI Whisper, etc.) in the future.

## Goals
- Support Volcengine Doubao ASR.
- Unified transcription flow in `main.ts`.
- Service-driven constraints (chunking size, file size).
- Improved error handling and model switching.

## Decisions

### 1. Unified `TranscriptionService` Interface
We will enhance the `TranscriptionService` interface to include a `getConstraints()` method that returns the provider's limits.

```typescript
export interface TranscriptionConstraints {
    maxDurationSeconds: number;
    maxSizeBytes: number;
    supportedFormats: string[];
}

export interface TranscriptionService {
    readonly name: string;
    transcribe(audio: Blob | File, options?: TranscriptionOptions): Promise<TranscriptionResult>;
    getConstraints(): TranscriptionConstraints;
}
```

### 2. Volcengine Implementation
We will use the **Flash Edition** of Volcengine ASR as it supports direct base64 upload and up to 2 hours of audio, which fits the user's requirements perfectly and is easier to implement than the polling-based Standard Edition.

### 3. Unified Transcription Handler in `ASRPlugin`
The logic for checking duration, chunking, and calling the service will be moved to a single private method `processTranscription(audio: Blob | File, sourceFile?: TFile)`.

### 4. Audio Chunker Improvement
`AudioConverter.splitAndConvert` will be updated to take the target duration as a parameter, defaulting to the service's `maxDurationSeconds`.

## Risks / Trade-offs
- **Base64 size overhead**: Flash Edition uses base64, which increases payload size by ~33%. For a 100MB audio file, this results in a ~133MB JSON body. This should be fine for most desktop environments, but we should be aware of memory usage in Obsidian.
- **Provider-specific settings**: Adding more providers makes the settings tab more complex. We will use conditional rendering in the settings tab to only show relevant fields.
