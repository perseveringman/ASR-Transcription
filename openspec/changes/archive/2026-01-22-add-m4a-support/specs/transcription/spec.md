## MODIFIED Requirements

### Requirement: Zhipu API Integration

The plugin SHALL integrate with Zhipu AI's GLM-ASR-2512 model to transcribe audio files into text.

#### Scenario: Successful transcription with file upload

- **WHEN** a user uploads a valid audio file (WAV, MP3, or M4A, ≤ 25MB, ≤ 30 seconds)
- **AND** a valid API key is configured
- **THEN** the system sends the audio to Zhipu API endpoint `https://open.bigmodel.cn/api/paas/v4/audio/transcriptions`
- **AND** receives the transcribed text in the response
- **AND** inserts the text into the editor according to the configured insertion strategy
