# Obsidian ASR Voice Transcription

A voice transcription plugin for Obsidian using Zhipu AI's GLM-ASR-2512 model.

## Features

- **Audio Recording**: Record audio directly within Obsidian.
- **File Upload**: Upload existing WAV or MP3 files for transcription.
- **Zhipu AI Integration**: High-quality transcription using GLM-ASR-2512.
- **Flexible Insertion**: Insert text at cursor, at document end, or into a new note.
- **Customizable**: Configure timestamps, separators, hotwords, and context prompts.

## Installation

1. Create a folder named `ASR-Transcription` in your vault's `.obsidian/plugins/` directory.
2. Copy `main.js`, `manifest.json`, and `styles.css` into that folder.
3. Enable the plugin in Obsidian's community plugins settings.

## Configuration

1. Obtain an API Key from [Zhipu AI Platform](https://open.bigmodel.cn).
2. Enter the API Key in the plugin's settings.
3. (Optional) Configure insertion position and other preferences.

## Usage

- Use the command palette (`Ctrl/Cmd + P`) and search for "Open transcription modal".
- Click "Start Recording" to begin.
- Click "Stop Recording" to finish and transcribe.
- Alternatively, click "Upload File" to select an existing audio file.

## Privacy

Audio data is uploaded to Zhipu AI for transcription. No audio files are stored locally by the plugin.

## License

MIT
