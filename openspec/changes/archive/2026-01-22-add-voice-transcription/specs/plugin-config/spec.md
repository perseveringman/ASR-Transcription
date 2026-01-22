# Specification: Plugin Configuration

This specification defines the configuration management capabilities for the voice transcription plugin.

## ADDED Requirements

### Requirement: Settings Page Integration

The plugin SHALL provide a dedicated settings page within Obsidian's settings interface.

#### Scenario: Access plugin settings

- **WHEN** a user opens Obsidian settings
- **AND** navigates to the "Community plugins" section
- **THEN** a "Voice Transcription" entry is visible in the plugin list
- **AND** clicking the settings icon opens the plugin settings page

#### Scenario: Settings page layout

- **WHEN** the plugin settings page is displayed
- **THEN** it includes the following sections in order:
  1. API Configuration (Zhipu API Key)
  2. Transcription Options (hot words, context prompt)
  3. Text Insertion Settings (position, timestamp, separator)
  4. Advanced Options (request timeout, retry count)
- **AND** each section has a clear heading
- **AND** each setting includes a description

### Requirement: API Key Configuration

The plugin SHALL allow users to securely configure their Zhipu API key.

#### Scenario: Enter API key

- **WHEN** a user enters an API key in the settings
- **THEN** the input field uses `type="password"` to obscure the key
- **AND** the system validates the key format (non-empty string)
- **AND** saves the key to Obsidian's data.json file
- **AND** the key is encrypted by Obsidian's storage mechanism

#### Scenario: Test API key validity

- **WHEN** a user clicks the "Test API Key" button
- **THEN** the system sends a minimal test request to Zhipu API
- **AND** if successful, displays a success notice: "API Key is valid"
- **AND** if failed, displays an error notice with the specific error (e.g., "Invalid API Key", "Network error")

#### Scenario: Empty API key warning

- **WHEN** a user attempts to start a recording or upload a file
- **AND** no API key is configured
- **THEN** the system prevents the action
- **AND** displays a warning notice: "Please configure your Zhipu API Key in settings"
- **AND** provides a button to open the settings page directly

#### Scenario: Show/hide API key

- **WHEN** a user clicks the "Show" icon next to the API key input
- **THEN** the input field type changes to `text` and the full key is visible
- **WHEN** the user clicks the "Hide" icon
- **THEN** the input field type changes back to `password` and the key is obscured

### Requirement: Text Insertion Configuration

The plugin SHALL allow users to configure how transcribed text is inserted into notes.

#### Scenario: Select insertion position

- **WHEN** a user opens the insertion settings
- **THEN** a dropdown is displayed with the following options:
  - "Cursor position" (default)
  - "Document end"
  - "New note"
- **WHEN** the user selects an option
- **THEN** the system saves the selection
- **AND** all future transcriptions use the selected position

#### Scenario: Configure new note options

- **WHEN** the user selects "New note" as the insertion position
- **THEN** additional settings appear:
  - "New note folder" (folder picker, default: root)
  - "New note name template" (text input, default: `Voice Note YYYY-MM-DD HH-mm-ss`)
- **AND** the system validates that the folder path exists
- **AND** supports date/time placeholders in the template

#### Scenario: Enable timestamp insertion

- **WHEN** a user toggles the "Add timestamp" option to ON
- **THEN** the system saves the preference
- **AND** all future transcriptions prepend timestamps in the format `[YYYY-MM-DD HH:mm:ss]`
- **WHEN** the user toggles it to OFF
- **THEN** transcriptions are inserted without timestamps

#### Scenario: Enable separator insertion

- **WHEN** a user toggles the "Add separator" option to ON
- **THEN** the system saves the preference
- **AND** all future transcriptions are preceded by a horizontal rule (`---`)
- **WHEN** the user toggles it to OFF
- **THEN** transcriptions are inserted without separators

### Requirement: Hot Words Management

The plugin SHALL allow users to configure domain-specific hot words to improve recognition accuracy.

#### Scenario: Add hot words

- **WHEN** a user enters text in the "Hot words" input field
- **AND** clicks the "Add" button or presses Enter
- **THEN** the system adds the word to the hot words list
- **AND** displays the word as a tag/chip in the UI
- **AND** saves the updated list to settings

#### Scenario: Remove hot words

- **WHEN** a user clicks the "X" icon on a hot word tag
- **THEN** the system removes the word from the hot words list
- **AND** updates the UI
- **AND** saves the updated list to settings

#### Scenario: Hot words limit enforcement

- **WHEN** a user attempts to add more than 100 hot words
- **THEN** the system prevents the addition
- **AND** displays a warning notice: "Hot words limit reached (maximum 100)"

#### Scenario: Hot words validation

- **WHEN** a user enters a hot word
- **THEN** the system trims leading/trailing whitespace
- **AND** rejects empty strings
- **AND** prevents duplicate words
- **AND** displays a warning if the word is a duplicate: "This hot word already exists"

### Requirement: Advanced Configuration Options

The plugin SHALL provide advanced settings for technical users to fine-tune behavior.

#### Scenario: Configure request timeout

- **WHEN** a user enters a timeout value (in seconds) in the settings
- **THEN** the system validates the value is between 10 and 120 seconds
- **AND** if valid, saves the value
- **AND** if invalid, displays an error: "Timeout must be between 10 and 120 seconds"
- **AND** uses this timeout for all API requests

#### Scenario: Configure retry count

- **WHEN** a user enters a retry count in the settings
- **THEN** the system validates the value is between 0 and 5
- **AND** if valid, saves the value
- **AND** if invalid, displays an error: "Retry count must be between 0 and 5"
- **AND** uses this count for retry logic on network failures

#### Scenario: Enable debug logging

- **WHEN** a user toggles the "Debug logging" option to ON
- **THEN** the system saves the preference
- **AND** all API requests, responses, and errors are logged to the console
- **WHEN** the user toggles it to OFF
- **THEN** only errors are logged to the console

### Requirement: Default Configuration Values

The plugin SHALL initialize with sensible default values for all settings.

#### Scenario: First-time plugin load

- **WHEN** the plugin is loaded for the first time
- **THEN** the following default values are set:
  - API Key: empty string (must be configured by user)
  - Insertion position: "Cursor position"
  - Add timestamp: OFF
  - Add separator: OFF
  - New note folder: "/" (root)
  - New note template: "Voice Note YYYY-MM-DD HH-mm-ss"
  - Hot words: empty array
  - Request timeout: 60 seconds
  - Retry count: 3
  - Debug logging: OFF

### Requirement: Configuration Persistence

The plugin SHALL persist all configuration changes immediately and reliably.

#### Scenario: Save settings on change

- **WHEN** a user modifies any setting
- **THEN** the system saves the change to Obsidian's data.json file immediately
- **AND** no explicit "Save" button is required
- **AND** the change persists across Obsidian restarts

#### Scenario: Load settings on startup

- **WHEN** Obsidian starts and loads the plugin
- **THEN** the system reads all settings from data.json
- **AND** validates each setting value
- **AND** if a setting is invalid or missing, uses the default value
- **AND** logs a warning to console if defaults are used

### Requirement: Settings Validation and Error Handling

The plugin SHALL validate all configuration inputs and provide clear error messages.

#### Scenario: Invalid folder path

- **WHEN** a user enters a folder path for new notes
- **AND** the folder does not exist in the vault
- **THEN** the system displays a warning: "Folder does not exist. It will be created when needed."
- **AND** saves the path anyway
- **AND** creates the folder when the first note is created

#### Scenario: Invalid template syntax

- **WHEN** a user enters a note name template
- **AND** the template contains invalid characters for file names (e.g., `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`)
- **THEN** the system displays an error: "Template contains invalid characters for file names"
- **AND** does not save the template
- **AND** highlights the invalid characters

#### Scenario: Reset to defaults

- **WHEN** a user clicks the "Reset to Defaults" button in settings
- **THEN** the system displays a confirmation dialog: "Reset all settings to default values?"
- **AND** if confirmed, resets all settings to their default values
- **AND** updates the UI to reflect the defaults
- **AND** displays a success notice: "Settings reset to defaults"

### Requirement: Configuration Export and Import

The plugin SHALL allow users to export and import their configuration for backup or sharing.

#### Scenario: Export configuration

- **WHEN** a user clicks the "Export Settings" button
- **THEN** the system generates a JSON file containing all settings except the API key
- **AND** prompts the user to save the file
- **AND** the file is named `voice-transcription-settings.json`

#### Scenario: Import configuration

- **WHEN** a user clicks the "Import Settings" button
- **AND** selects a valid configuration JSON file
- **THEN** the system reads the file
- **AND** validates all settings in the file
- **AND** applies the valid settings
- **AND** displays a summary: "Imported X settings successfully"
- **AND** if any settings are invalid, logs warnings but continues

#### Scenario: Import with API key security

- **WHEN** an imported configuration file contains an API key field
- **THEN** the system ignores the API key value for security reasons
- **AND** displays a notice: "API Key was not imported. Please configure it manually."

### Requirement: Context Prompt Configuration

The plugin SHALL allow users to provide context for improved transcription accuracy.

#### Scenario: Set default context prompt

- **WHEN** a user enters text in the "Context prompt" field (textarea)
- **THEN** the system saves the text
- **AND** validates the length is ≤ 8000 characters
- **AND** if exceeded, displays an error: "Context prompt must be 8000 characters or less"
- **AND** truncates the input at 8000 characters

#### Scenario: Character count display

- **WHEN** a user is typing in the "Context prompt" field
- **THEN** the system displays the current character count below the textarea
- **AND** updates it in real-time
- **AND** shows the count in red when approaching or exceeding 8000 characters

#### Scenario: Clear context prompt

- **WHEN** a user clicks the "Clear" button next to the context prompt field
- **THEN** the system clears the textarea
- **AND** saves the empty value
- **AND** future transcriptions do not include a context prompt
