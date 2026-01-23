## 1. Research and Design
- [ ] 1.1 Review Volcengine Doubao ASR API documentation for Flash Edition
- [ ] 1.2 Design unified `TranscriptionService` interface with capability discovery

## 2. Types and Settings
- [ ] 2.1 Update `src/types/config.ts` with Volcengine settings and provider choice
- [ ] 2.2 Update `src/types/transcription.ts` for improved interface and common response formats

## 3. Service Implementation
- [ ] 3.1 Implement `VolcengineTranscriptionService` in `src/services/transcription/volcengine-api.ts`
- [ ] 3.2 Update `ZhipuTranscriptionService` to match the new interface
- [ ] 3.3 Refactor `TranscriptionServiceFactory` to handle provider instantiation

## 4. UI Updates
- [ ] 4.1 Update `src/ui/settings-tab.ts` to support multi-provider configuration

## 5. Main Plugin Logic Refactoring
- [ ] 5.1 Create a unified transcription coordinator or helper method in `main.ts`
- [ ] 5.2 Remove hardcoded 30s limits and use service-provided limits
- [ ] 5.3 Consolidate duplicated transcription handling code in `main.ts`

## 6. Verification
- [ ] 6.1 Verify Zhipu still works as expected
- [ ] 6.2 Verify Doubao ASR works with short and long audio
