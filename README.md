# Obsidian ASR-Transcription Plugin

English | [简体中文](README_CN.md)

A speech-to-text plugin for Obsidian, supporting Zhipu AI and Volcengine Doubao models.

## Features

- **Voice Recording**: Record audio directly in Obsidian and transcribe in real-time.
- **File Transcription**: Transcribe audio files referenced in notes or local files.
- **Context Menu Support**: Right-click on audio files in the file list to quickly transcribe to a new note.
- **Multi-Model Support**:
  - **Zhipu AI (GLM-ASR-2512)**: Ideal for short audio (auto-slicing for clips under 30 seconds), cost-effective.
  - **Volcengine Doubao (Standard)**: Supports long audio up to 4 hours, single file up to 512MB, perfect for meetings and lectures.
- **Flexible Insertion**: Insert at cursor, end of document, or create a new note.
- **Highly Customizable**: Supports timestamps, separators, hot words, context prompts, and custom templates.

## Installation

1. Create a folder named `obsidian-asr` in your vault's `.obsidian/plugins/` directory.
2. Copy `main.js`, `manifest.json`, and `styles.css` files into that folder.
3. Enable the plugin in Obsidian's "Community Plugins" settings.

## Configuration

You can select your preferred service provider in the plugin settings.

### 1. Zhipu AI Setup
- **Get API Key**: Visit [Zhipu AI Open Platform](https://open.bigmodel.cn/).
- **Activate Service**: Register and log in, then obtain your `API Key` from the console.
- **Limitation**: Single audio segment recommended under 30 seconds (plugin auto-slices longer audio).

### 2. Volcengine Doubao Setup
- **Get Credentials**: Visit [Volcengine Console](https://console.volcengine.com/).
- **Activate Service**: Search for "Speech Recognition" and enable the service.
- **Get App ID**: Create a project in the "Speech Recognition" console to obtain your `App ID`.
- **Get Access Token**: Obtain your `Access Token` from "API Key Management" in the console.
- **Resource Authorization**: Ensure you have access to `volc.seedasr.auc` (Doubao Audio Recognition Model 2.0 Standard).
- **Advantages**: Single file up to 512MB, duration up to 4 hours, no manual slicing required.

## Usage

### Voice Recording & Transcription
- Use the command palette (`Ctrl/Cmd + P`) and search for "Open transcription modal".
- Click "Start Recording" to begin recording.
- Click "Stop Recording" to stop and trigger transcription.

### Transcribe Audio Referenced in Notes
- In a note containing audio references, execute the command "Transcribe referenced audio in current note".
- The plugin will identify audio files in the note and insert transcription results below.

### Quick Transcription via Context Menu
- In Obsidian's left file list, right-click on any audio file (supports mp3, wav, m4a, ogg, etc.).
- Select "Transcribe audio", and the plugin will automatically transcribe and create a new Markdown note based on the template.

## Privacy Notice

Audio data will be uploaded to your chosen service provider (Zhipu AI or Volcengine) for processing. The plugin itself does not store your audio anywhere beyond local storage.

## License

MIT
