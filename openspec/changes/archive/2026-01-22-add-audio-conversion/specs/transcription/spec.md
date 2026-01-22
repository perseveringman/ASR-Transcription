## ADDED Requirements

### Requirement: Automatic Audio Conversion

The plugin SHALL automatically convert unsupported or potentially incompatible audio formats to a compatible format before transcription.

#### Scenario: m4a to WAV conversion
- **WHEN** a user provides an m4a file for transcription
- **THEN** the system decodes the audio using Web Audio API
- **AND** encodes it into 16-bit PCM WAV format (mono, same sample rate)
- **AND** sends the resulting WAV blob to the transcription service
- **AND** displays a notice: "Converting m4a to WAV for compatibility..."
