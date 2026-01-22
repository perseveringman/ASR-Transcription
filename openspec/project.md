# Project Context

## Purpose

This project is an Obsidian plugin that provides voice-to-text transcription capabilities directly within the Obsidian note-taking application. The goal is to enable users to quickly capture spoken thoughts as written text without leaving their note-taking environment, improving productivity and accessibility.

**Key Objectives:**
- Seamless integration with Obsidian's editing workflow
- Support both real-time recording and audio file upload
- High-quality transcription using AI-powered speech recognition
- Flexible text insertion strategies to match user workflows
- Extensible architecture for future multi-provider support

## Tech Stack

### Core Technologies
- **TypeScript 5.0+**: Primary development language with strict type checking
- **Obsidian Plugin API**: Core framework for plugin development
- **esbuild / Rollup**: Module bundler for optimized production builds
- **Node.js 18+**: Development environment

### Runtime APIs
- **MediaRecorder API**: Browser-native audio recording
- **Fetch API**: HTTP client for API requests
- **Web Storage API**: Persisting plugin settings (via Obsidian's data.json)

### External Services
- **Zhipu AI GLM-ASR-2512**: Primary speech-to-text API provider (Phase 1)
- Future providers: OpenAI Whisper, Azure Speech Service (planned)

### Development Tools
- **ESLint + Prettier**: Code linting and formatting
- **Jest / Vitest**: Unit and integration testing
- **TypeDoc**: API documentation generation

## Project Conventions

### Code Style

**General Principles:**
- Follow TypeScript strict mode conventions
- Prefer functional programming patterns where appropriate
- Use descriptive variable and function names
- Keep functions small and focused (single responsibility)

**Naming Conventions:**
- **Files**: kebab-case (e.g., `audio-recorder.ts`, `settings-tab.ts`)
- **Classes**: PascalCase (e.g., `AudioRecorder`, `ZhipuTranscriptionService`)
- **Interfaces/Types**: PascalCase with descriptive names (e.g., `TranscriptionService`, `PluginSettings`)
- **Functions/Methods**: camelCase (e.g., `startRecording()`, `insertAtCursor()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `API_BASE_URL`)
- **Private fields**: Prefix with underscore (e.g., `_apiKey`, `_state`)

**Formatting:**
- Indent: 2 spaces (not tabs)
- Line length: 100 characters max
- Semicolons: Always use
- Quotes: Single quotes for strings, double quotes for JSX/attributes
- Trailing commas: Always in multi-line objects/arrays

**Example:**
```typescript
export class AudioRecorder extends EventEmitter {
  private _state: RecordingState = RecordingState.IDLE;
  private readonly _maxDuration: number = 30000; // 30 seconds

  async start(): Promise<void> {
    if (this._state !== RecordingState.IDLE) {
      throw new Error('Cannot start: recorder is busy');
    }
    // Implementation...
  }
}
```

### Architecture Patterns

**1. Service Layer Pattern**
- Separate business logic from UI components
- Services are stateful classes responsible for specific domains:
  - `AudioRecorder`: Audio capture and state management
  - `TranscriptionService`: API communication (abstracted)
  - `ConfigManager`: Settings persistence and validation
  - `TextInserter`: Editor manipulation

**2. Strategy Pattern**
- `TranscriptionService` interface allows swapping API providers
- `TranscriptionServiceFactory` creates provider instances
- Example: `ZhipuTranscriptionService`, future `OpenAITranscriptionService`

**3. Event-Driven Architecture**
- Use `EventEmitter` for asynchronous state changes
- UI components subscribe to service events (e.g., `statechange`, `progress`)
- Decouple UI from service implementation details

**4. Error Handling**
- Custom error types (e.g., `TranscriptionError`) with semantic error codes
- Never expose raw HTTP errors to users
- Map technical errors to user-friendly messages with actionable guidance

**5. Dependency Injection**
- Pass dependencies via constructor parameters
- Facilitates testing with mocks/stubs
- Example: `TextInserter` receives `Vault` and `Editor` instances

**Example Architecture:**
```
┌─────────────┐
│ UI Layer    │  (RecordingView, SettingsTab)
└─────┬───────┘
      │ subscribes to events
      ▼
┌─────────────┐
│ Service     │  (AudioRecorder, TranscriptionService)
│ Layer       │  (ConfigManager, TextInserter)
└─────┬───────┘
      │ uses abstractions
      ▼
┌─────────────┐
│ External    │  (Zhipu API, Obsidian API)
│ APIs        │
└─────────────┘
```

### Testing Strategy

**Testing Pyramid:**
- **Unit Tests (70%)**: Test individual functions and classes in isolation
- **Integration Tests (20%)**: Test interactions between services
- **Manual Tests (10%)**: Test UI and browser-specific features

**Unit Testing Guidelines:**
- Test all public methods in service classes
- Mock external dependencies (HTTP clients, browser APIs, Obsidian API)
- Test both success and error paths
- Use descriptive test names: `should [expected behavior] when [condition]`
- Aim for >80% code coverage

**Integration Testing:**
- Test complete workflows (recording → transcription → insertion)
- Use real API calls in a dedicated test environment (with test API key)
- Test error scenarios (network failures, API errors)

**Manual Testing Checklist:**
- Cross-browser testing (Chrome, Safari, Firefox)
- Microphone permission handling
- Settings UI interaction
- Keyboard shortcuts
- Edge cases (large files, long recordings, invalid API key)

**Testing Tools:**
- **Jest** or **Vitest**: Test runner
- **ts-jest**: TypeScript support
- **Mock Service Worker (MSW)**: HTTP mocking for API tests

### Git Workflow

**Branching Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/[name]`: Individual feature branches (e.g., `feature/audio-recording`)
- `bugfix/[name]`: Bug fix branches

**Commit Conventions:**
Follow Conventional Commits specification:
- `feat:` New features (e.g., `feat: add audio recording service`)
- `fix:` Bug fixes (e.g., `fix: handle microphone permission denial`)
- `refactor:` Code refactoring without behavior change
- `test:` Adding or updating tests
- `docs:` Documentation updates
- `chore:` Build, tooling, or dependency updates

**Commit Message Format:**
```
<type>: <short description>

[optional body explaining the change]

[optional footer with breaking changes or issue references]
```

**Example:**
```
feat: implement Zhipu API integration

- Add ZhipuTranscriptionService implementing TranscriptionService interface
- Implement multipart/form-data request with API key authentication
- Add error mapping for HTTP status codes
- Implement exponential backoff retry logic

Closes #12
```

**Pull Request Process:**
1. Create feature branch from `develop`
2. Implement feature with tests
3. Run linter and tests locally
4. Open PR with description and reference to spec/task
5. Address review feedback
6. Merge to `develop` after approval
7. Delete feature branch after merge

## Domain Context

### Obsidian Plugin Ecosystem
- **Obsidian** is a local-first, Markdown-based knowledge base application
- Plugins extend Obsidian's functionality using JavaScript/TypeScript
- Plugins have access to:
  - Vault API (file system operations)
  - Editor API (text manipulation)
  - Settings API (configuration persistence)
  - Command palette API (registering commands)
  - UI APIs (modals, notices, sidebars)

### Speech Recognition Concepts
- **ASR (Automatic Speech Recognition)**: Converting spoken audio to text
- **Hot words**: Domain-specific vocabulary to improve recognition accuracy
- **Context prompt**: Previous text that provides context for better accuracy
- **Streaming transcription**: Real-time transcription as audio is recorded (Phase 2)
- **Non-streaming transcription**: Transcribe entire audio after recording ends (Phase 1)

### Audio Formats
- **WAV**: Uncompressed, high quality, large file size
- **MP3**: Compressed, smaller size, good quality (preferred)
- **WebM**: Browser-native format (Chrome/Edge), needs conversion
- **Sample rate**: 16 kHz is standard for speech recognition
- **Channels**: Mono (1 channel) is sufficient for speech

## Important Constraints

### Technical Constraints
- **Audio Duration Limit**: Zhipu API restricts audio to ≤ 30 seconds (API limitation)
- **File Size Limit**: Zhipu API restricts files to ≤ 25 MB (API limitation)
- **Browser Compatibility**: MediaRecorder API not supported in older browsers (IE, old Safari)
- **Format Support**: Different browsers support different audio formats natively
- **Network Dependency**: Transcription requires internet connection (no offline mode in Phase 1)

### API Constraints
- **Rate Limiting**: Zhipu API may have rate limits (check documentation)
- **Cost**: API calls are billed per second of audio transcribed
- **Authentication**: Requires valid API key from Zhipu platform
- **Endpoint**: Must use `https://open.bigmodel.cn/api/paas/v4/audio/transcriptions`

### User Experience Constraints
- **Real-time Feedback**: Users expect <1 second to start recording
- **Transcription Speed**: Ideally <5 seconds for a 10-second audio clip
- **Error Clarity**: Error messages must be actionable, not technical jargon

### Security Constraints
- **API Key Storage**: Must be stored securely (Obsidian encrypts data.json)
- **Audio Privacy**: Users must be informed that audio is uploaded to third-party servers
- **No Logging**: Do not log sensitive data (API keys, audio content)

## External Dependencies

### Zhipu AI Platform
- **Endpoint**: `https://open.bigmodel.cn/api/paas/v4/audio/transcriptions`
- **Model**: GLM-ASR-2512 (multilingual speech recognition)
- **Authentication**: Bearer token in Authorization header
- **Documentation**: https://docs.bigmodel.cn/api-reference/模型-api/语音转文本
- **Rate Limits**: Check platform documentation (not specified in public docs)
- **Pricing**: Pay-per-use, charged by audio duration
- **SLA**: Not specified, assume best-effort availability

### Obsidian Plugin API
- **Version Compatibility**: Target Obsidian 1.0.0+
- **API Documentation**: https://github.com/obsidianmd/obsidian-api
- **Key APIs Used**:
  - `Plugin` class for lifecycle management
  - `Editor` for text insertion
  - `Vault` for file operations (new note creation)
  - `PluginSettingTab` for settings UI
  - `Notice` for user notifications
  - `addCommand()` for command palette integration

### Browser APIs
- **MediaRecorder API**: Recording audio from microphone
  - Support: Chrome 47+, Firefox 25+, Safari 14+
  - Requires HTTPS or localhost for microphone access
  - Documentation: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder

- **Fetch API**: HTTP requests to Zhipu API
  - Universally supported in modern browsers
  - Supports AbortController for cancellation

### Development Dependencies
- **TypeScript**: Type checking and compilation
- **esbuild**: Fast bundling for development and production
- **Obsidian API Types**: `obsidian` npm package for type definitions
- **Testing Libraries**: Jest/Vitest, @testing-library (if applicable)

### Future Dependencies (Planned for Phase 2+)
- **OpenAI API**: Whisper model integration
- **Azure Speech Service**: Microsoft's speech-to-text API
- **FFmpeg.wasm**: Client-side audio format conversion
