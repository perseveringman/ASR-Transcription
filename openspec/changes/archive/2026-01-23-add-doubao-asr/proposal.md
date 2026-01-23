# Change: Add Doubao ASR Support and Refactor Model Logic

## Why
The current transcription logic is hardcoded for Zhipu AI's 30-second limit and has duplicated code across several methods in `main.ts`. Volcengine's Doubao ASR supports much longer audio (up to 2 hours) and larger files. We need to support this new provider and clean up the architecture to make it easier to add more providers in the future and manage model-specific constraints.

## What Changes
- **ADDED** support for Volcengine Doubao ASR (Flash Edition).
- **ADDED** settings for Volcengine (App ID, Access Token).
- **MODIFIED** `TranscriptionService` interface to include model-specific limits (max duration, max size).
- **MODIFIED** `TranscriptionServiceFactory` to support multiple providers.
- **REFACTORED** `main.ts` transcription logic into a more unified and clean implementation, moving model-specific constraints into the services.
- **UPDATED** audio conversion and chunking logic to use limits provided by the active transcription service.

## Impact
- Affected specs: `transcription`, `plugin-config`
- Affected code: `src/main.ts`, `src/services/transcription/*`, `src/types/*`, `src/ui/settings-tab.ts`
