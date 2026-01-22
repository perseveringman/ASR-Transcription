# Specification: Voice Transcription

This specification defines the core voice-to-text transcription capability using external API services.

## ADDED Requirements

### Requirement: Zhipu API Integration

The plugin SHALL integrate with Zhipu AI's GLM-ASR-2512 model to transcribe audio files into text.

#### Scenario: Successful transcription with file upload

- **WHEN** a user uploads a valid audio file (WAV or MP3, ≤ 25MB, ≤ 30 seconds)
- **AND** a valid API key is configured
- **THEN** the system sends the audio to Zhipu API endpoint `https://open.bigmodel.cn/api/paas/v4/audio/transcriptions`
- **AND** receives the transcribed text in the response
- **AND** inserts the text into the editor according to the configured insertion strategy

#### Scenario: Successful transcription with recorded audio

- **WHEN** a user completes an audio recording session
- **AND** the recording duration is ≤ 30 seconds
- **AND** a valid API key is configured
- **THEN** the system converts the recorded audio to a supported format (MP3 or WAV)
- **AND** sends the audio to Zhipu API
- **AND** receives the transcribed text
- **AND** inserts the text into the editor

#### Scenario: Transcription with hot words

- **WHEN** the user has configured hot words in the plugin settings
- **AND** initiates a transcription request
- **THEN** the system includes the hot words in the API request
- **AND** the transcription results prioritize recognition of the specified hot words

#### Scenario: Transcription with context prompt

- **WHEN** the user provides a context prompt (previous transcription or related text)
- **AND** the context is ≤ 8000 characters
- **AND** initiates a transcription request
- **THEN** the system includes the prompt in the API request
- **AND** the transcription results are more contextually accurate

### Requirement: Error Handling for Transcription Failures

The plugin SHALL handle various transcription error scenarios and provide clear user feedback.

#### Scenario: Invalid API key

- **WHEN** a transcription request is made with an invalid or missing API key
- **THEN** the system displays an error notice: "Zhipu API Key is invalid. Please check your settings."
- **AND** provides a link to the settings page
- **AND** does not consume the audio data

#### Scenario: File too large

- **WHEN** a user attempts to upload an audio file > 25MB
- **THEN** the system prevents the upload
- **AND** displays an error notice: "Audio file exceeds 25MB limit. Please use a shorter recording or compress the file."
- **AND** does not send the request to the API

#### Scenario: Audio duration too long

- **WHEN** a user records audio for > 30 seconds
- **THEN** the system automatically stops the recording at 30 seconds
- **AND** displays a warning notice: "Recording stopped at 30-second limit."
- **AND** proceeds with transcription of the 30-second audio

#### Scenario: Network failure

- **WHEN** a transcription request fails due to network connectivity issues
- **THEN** the system retries up to 3 times with exponential backoff (1s, 2s, 4s)
- **AND** if all retries fail, displays an error notice: "Network error. Please check your internet connection and try again."
- **AND** preserves the audio data for potential retry

#### Scenario: API service unavailable

- **WHEN** the Zhipu API returns a 5xx server error
- **THEN** the system retries up to 3 times
- **AND** if all retries fail, displays an error notice: "Zhipu service is temporarily unavailable. Please try again later."

#### Scenario: Unsupported audio format

- **WHEN** a user uploads an audio file with an unsupported format (not WAV or MP3)
- **THEN** the system rejects the file
- **AND** displays an error notice: "Unsupported audio format. Please upload a WAV or MP3 file."

### Requirement: Transcription Service Abstraction

The plugin SHALL implement an abstract interface for transcription services to support future integration with additional providers.

#### Scenario: Service provider interface

- **WHEN** implementing a new transcription service provider
- **THEN** the service MUST implement the `TranscriptionService` interface
- **AND** provide methods: `transcribe(audio, options)`, `supportsStreaming()`
- **AND** return standardized `TranscriptionResult` objects

#### Scenario: Service factory instantiation

- **WHEN** the plugin initializes
- **THEN** the system loads the configured transcription provider (default: 'zhipu')
- **AND** instantiates the corresponding service implementation via `TranscriptionServiceFactory`
- **AND** validates the provider configuration (API key, endpoint)

### Requirement: Request Tracking and Debugging

The plugin SHALL provide request tracking information to help users debug issues.

#### Scenario: Request ID logging

- **WHEN** a transcription request is sent to Zhipu API
- **THEN** the system generates or receives a unique `request_id`
- **AND** logs the request ID to the console for debugging
- **AND** includes the request ID in error messages when failures occur

#### Scenario: Response time monitoring

- **WHEN** a transcription request completes
- **THEN** the system logs the total response time (upload + processing)
- **AND** displays a success notice including the response time
- **AND** warns the user if the response time exceeds 10 seconds

### Requirement: Loading State Feedback

The plugin SHALL provide clear visual feedback during transcription operations.

#### Scenario: Transcription in progress

- **WHEN** a transcription request is initiated
- **THEN** the system displays a loading indicator with the message "Transcribing audio..."
- **AND** disables the recording and upload buttons
- **AND** shows a progress animation

#### Scenario: Canceling transcription

- **WHEN** a transcription is in progress
- **AND** the user clicks a cancel button
- **THEN** the system aborts the HTTP request
- **AND** hides the loading indicator
- **AND** re-enables the recording and upload buttons
- **AND** displays a notice: "Transcription canceled"

### Requirement: Transcription Result Processing

The plugin SHALL process and format transcription results before insertion.

#### Scenario: Basic text insertion

- **WHEN** transcription completes successfully
- **AND** no formatting options are enabled
- **THEN** the system inserts the raw transcribed text at the configured position

#### Scenario: Timestamp addition

- **WHEN** transcription completes successfully
- **AND** the "Add timestamp" option is enabled in settings
- **THEN** the system prepends the current timestamp to the transcribed text
- **AND** uses the format: `[YYYY-MM-DD HH:mm:ss] <transcribed text>`

#### Scenario: Separator addition

- **WHEN** transcription completes successfully
- **AND** the "Add separator" option is enabled in settings
- **THEN** the system adds a horizontal rule (`---`) before the transcribed text
- **AND** adds a blank line after the separator

#### Scenario: Text trimming

- **WHEN** transcription completes successfully
- **AND** the transcribed text contains leading or trailing whitespace
- **THEN** the system trims the whitespace
- **AND** ensures the text ends with a newline character
