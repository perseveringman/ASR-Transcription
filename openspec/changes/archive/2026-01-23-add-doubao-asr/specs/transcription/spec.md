## ADDED Requirements

### Requirement: Volcengine Doubao ASR Integration

The plugin SHALL integrate with Volcengine's Doubao ASR (Flash Edition) to transcribe audio files.

#### Scenario: Successful transcription with Volcengine
- **WHEN** Volcengine is selected as the provider
- **AND** a valid App ID and Access Token are configured
- **AND** the user initiates transcription of an audio file (≤ 2 hours, ≤ 100MB)
- **THEN** the system sends the audio data (base64 encoded) to `https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash`
- **AND** receives and processes the transcribed text

### Requirement: Provider-Specific Constraints

The transcription system SHALL respect the specific constraints (max duration, max size) of the active provider.

#### Scenario: Zhipu 30s limit
- **WHEN** Zhipu is the active provider
- **THEN** the system applies a 30-second chunking limit
- **AND** automatically splits longer audio into 30-second segments

#### Scenario: Doubao 2-hour limit
- **WHEN** Volcengine Doubao is the active provider
- **THEN** the system allows audio up to 2 hours without mandatory 30-second chunking
- **AND** only chunks if the file exceeds the provider's larger limits (e.g., 100MB for Flash Edition)

## ADDED Requirements

### Requirement: Enhanced Transcription Service Abstraction

The plugin SHALL implement an abstract interface for transcription services to support multiple providers with varying capabilities.

#### Scenario: Service provider interface

- **WHEN** implementing a new transcription service provider
- **THEN** the service MUST implement the `TranscriptionService` interface
- **AND** provide methods: `transcribe(audio, options)`, `getConstraints()`
- **AND** return standardized `TranscriptionResult` objects
