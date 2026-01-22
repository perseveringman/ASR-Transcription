## ADDED Requirements

### Requirement: Transcribe Referenced Audio

The plugin SHALL be able to identify and transcribe audio files referenced in the current active markdown note.

#### Scenario: Single audio reference transcription
- **WHEN** the user executes the "Transcribe referenced audio" command
- **AND** the current note contains exactly one audio file reference (MP3 or WAV)
- **THEN** the system automatically starts the transcription process for that file
- **AND** inserts the result directly below the reference in the note

#### Scenario: Multiple audio references selection
- **WHEN** the user executes the "Transcribe referenced audio" command
- **AND** the current note contains multiple audio file references
- **THEN** the system displays a selection modal listing all referenced audio files
- **AND** allows the user to pick one or more files to transcribe
- **AND** processes each selected file and inserts the results below their respective references

#### Scenario: No audio references found
- **WHEN** the user executes the "Transcribe referenced audio" command
- **AND** the current note contains no audio file references
- **THEN** the system displays a notice: "No audio file references found in current note."
