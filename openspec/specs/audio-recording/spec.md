# Specification: Audio Recording

This specification defines the audio recording and file upload capabilities for the voice transcription plugin.

## ADDED Requirements

### Requirement: Browser-Based Audio Recording

The plugin SHALL provide in-editor audio recording using the browser's MediaRecorder API.

#### Scenario: Start recording with microphone permission granted

- **WHEN** a user clicks the "Start Recording" button
- **AND** microphone permission has been previously granted
- **THEN** the system starts recording audio
- **AND** displays a recording indicator with elapsed time
- **AND** changes the button to "Stop Recording"
- **AND** disables the file upload button

#### Scenario: Request microphone permission

- **WHEN** a user clicks the "Start Recording" button for the first time
- **AND** microphone permission has not been granted
- **THEN** the system requests microphone access via `navigator.mediaDevices.getUserMedia()`
- **AND** if permission is granted, starts recording immediately
- **AND** if permission is denied, displays an error notice: "Microphone access is required for recording. Please grant permission in your browser settings."

#### Scenario: Stop recording

- **WHEN** a user clicks the "Stop Recording" button during an active recording
- **THEN** the system stops recording
- **AND** generates an audio Blob in a supported format (MP3 or WAV)
- **AND** automatically initiates transcription
- **AND** re-enables the file upload button

#### Scenario: Recording time limit enforcement

- **WHEN** a recording reaches 30 seconds duration
- **THEN** the system automatically stops recording
- **AND** displays a warning notice: "Recording stopped at 30-second limit"
- **AND** automatically initiates transcription

#### Scenario: Display recording duration

- **WHEN** recording is in progress
- **THEN** the system displays the elapsed time in `MM:SS` format
- **AND** updates the display every second
- **AND** displays a warning indicator when reaching 25 seconds (5 seconds before cutoff)

### Requirement: Audio Format Selection

The plugin SHALL automatically select the best supported audio format based on browser capabilities.

#### Scenario: Preferred format selection

- **WHEN** the plugin initializes the audio recorder
- **THEN** the system checks browser support for formats in priority order:
  1. `audio/mp4` (Safari)
  2. `audio/webm` (Chrome/Edge)
  3. `audio/wav` (fallback)
- **AND** selects the first supported format
- **AND** logs the selected format to the console

#### Scenario: No supported format available

- **WHEN** the plugin initializes the audio recorder
- **AND** none of the preferred formats are supported by the browser
- **THEN** the system disables the recording button
- **AND** displays an error notice: "Audio recording is not supported in this browser. Please use the file upload feature instead."

### Requirement: Audio File Upload

The plugin SHALL allow users to upload pre-recorded audio files for transcription.

#### Scenario: Select audio file for upload

- **WHEN** a user clicks the "Upload Audio" button
- **THEN** the system opens a file selection dialog
- **AND** filters for audio file types: `.wav`, `.mp3`
- **AND** allows selection of a single file

#### Scenario: Validate uploaded file format

- **WHEN** a user selects a file for upload
- **AND** the file extension is not `.wav` or `.mp3`
- **THEN** the system rejects the file
- **AND** displays an error notice: "Unsupported file format. Please select a WAV or MP3 file."

#### Scenario: Validate uploaded file size

- **WHEN** a user selects a file for upload
- **AND** the file size exceeds 25MB
- **THEN** the system rejects the file
- **AND** displays an error notice: "File size exceeds 25MB limit. Please select a smaller file."

#### Scenario: Successful file upload

- **WHEN** a user selects a valid audio file (correct format, ≤ 25MB)
- **THEN** the system accepts the file
- **AND** displays the file name and size
- **AND** automatically initiates transcription
- **AND** shows a loading indicator

### Requirement: Recording State Management

The plugin SHALL maintain clear recording states and prevent invalid state transitions.

#### Scenario: Recording state transitions

- **WHEN** the recorder is in `idle` state
- **THEN** the "Start Recording" button is enabled
- **AND** the "Upload Audio" button is enabled
- **WHEN** the recorder transitions to `recording` state
- **THEN** the "Stop Recording" button is enabled
- **AND** the "Upload Audio" button is disabled
- **WHEN** the recorder transitions to `processing` state (after stop)
- **THEN** both recording and upload buttons are disabled
- **AND** a loading indicator is shown
- **WHEN** the recorder returns to `idle` state (after success or error)
- **THEN** both buttons are re-enabled

#### Scenario: Prevent concurrent operations

- **WHEN** a recording is in progress
- **AND** a user attempts to upload a file
- **THEN** the upload button is disabled
- **AND** clicking it has no effect
- **WHEN** a transcription is in progress
- **AND** a user attempts to start a new recording
- **THEN** the recording button is disabled
- **AND** clicking it has no effect

### Requirement: Recording UI Components

The plugin SHALL provide intuitive UI elements for recording control and status display.

#### Scenario: Recording view layout

- **WHEN** the recording view is displayed
- **THEN** the UI includes:
  - A prominent "Start Recording" button (idle state) or "Stop Recording" button (recording state)
  - An "Upload Audio" button
  - A time display showing `00:00` (idle) or `MM:SS` (recording)
  - A visual recording indicator (e.g., pulsing red dot) when active
  - A status message area for notices and errors

#### Scenario: Keyboard shortcuts

- **WHEN** the recording view is active
- **AND** a user presses `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS)
- **THEN** if idle, the system starts recording
- **OR** if recording, the system stops recording

#### Scenario: Visual recording indicator

- **WHEN** recording is in progress
- **THEN** the system displays a pulsing red circle icon
- **AND** the time display text color changes to red
- **AND** the recording button background is highlighted

### Requirement: Audio Data Management

The plugin SHALL handle audio data securely and efficiently.

#### Scenario: Temporary audio storage

- **WHEN** a recording is stopped
- **THEN** the system stores the audio Blob in memory temporarily
- **AND** does not save the audio to disk
- **AND** clears the audio data after successful transcription
- **AND** clears the audio data if transcription fails

#### Scenario: Audio data privacy

- **WHEN** audio data is generated or uploaded
- **THEN** the system only transmits the audio to the configured transcription API
- **AND** does not cache audio files locally
- **AND** does not log audio content to console or files
- **AND** clears audio data from memory after processing

### Requirement: Recording Quality Configuration

The plugin SHALL use appropriate audio quality settings for optimal transcription results.

#### Scenario: Audio recording parameters

- **WHEN** the system initializes the MediaRecorder
- **THEN** it configures the following parameters:
  - Sample rate: 16000 Hz (minimum for speech recognition)
  - Channels: 1 (mono)
  - Bitrate: 64 kbps (sufficient for speech)
- **AND** these parameters are not user-configurable in the first release

### Requirement: Error Recovery for Recording

The plugin SHALL handle recording errors gracefully and allow users to retry.

#### Scenario: Recording interruption

- **WHEN** a recording is in progress
- **AND** the microphone becomes unavailable (e.g., device disconnected, permission revoked)
- **THEN** the system stops recording
- **AND** displays an error notice: "Recording interrupted. Microphone access was lost."
- **AND** returns to idle state
- **AND** discards the incomplete recording

#### Scenario: Retry after recording error

- **WHEN** a recording fails with an error
- **THEN** the system returns to idle state
- **AND** allows the user to click "Start Recording" again
- **AND** requests fresh microphone permission if needed

### Requirement: Obsidian Command Integration

The plugin SHALL integrate recording controls with Obsidian's command palette.

#### Scenario: Command palette actions

- **WHEN** a user opens the Obsidian command palette
- **THEN** the following commands are available:
  - "Voice Transcription: Start Recording"
  - "Voice Transcription: Stop Recording"
  - "Voice Transcription: Upload Audio File"
- **AND** commands are enabled/disabled based on current recorder state

#### Scenario: Execute command when idle

- **WHEN** a user selects "Voice Transcription: Start Recording" from the command palette
- **AND** the recorder is idle
- **THEN** the system starts recording as if the button was clicked

#### Scenario: Execute command when recording

- **WHEN** a user selects "Voice Transcription: Stop Recording" from the command palette
- **AND** the recorder is recording
- **THEN** the system stops recording and initiates transcription
