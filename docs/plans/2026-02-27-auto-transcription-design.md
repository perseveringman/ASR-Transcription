# Auto Transcription on Vault Open

## Problem

用户通过 iOS 快捷指令每天录音记录生活，录音同步到 Obsidian 的 `audioSaveFolder`。目前需要手动触发转写命令，希望实现：

1. 打开 Obsidian 时自动扫描音频目录，将未转写的语音自动转写成笔记
2. 扫描转写笔记目录，根据笔记标题中的日期自动在每日笔记中链接这些转写笔记
3. 实时监听新增音频文件并自动转写

## Design

### Architecture

新增两个组件：

- **`AutoTranscriptionManager`** (`src/managers/auto-transcription-manager.ts`)：负责自动扫描和监听音频文件，协调转写流程
- **`DailyNoteLinkService`** (`src/services/daily-note-link-service.ts`)：从 `BatchManager` 中提取的每日笔记链接服务，供多处复用

### Flow

```
Plugin onload
  │
  ├─ Initialize AutoTranscriptionManager
  │
  ├─ Initial Scan Phase
  │   ├─ List all audio files in audioSaveFolder
  │   ├─ For each file, check if transcription note exists in voiceNoteFolder
  │   │   └─ Match rule: audio ctime → Transcription-YYYYMMDD-HHmmss.md
  │   ├─ Queue unprocessed files
  │   └─ Process with TaskQueue (concurrency control)
  │       └─ For each: transcribe → polish → create note → link to daily note
  │
  └─ Event Listener Phase
      └─ vault.on('create', callback)
          ├─ Check: is file in audioSaveFolder?
          ├─ Check: is file an audio file?
          ├─ Delay 2-3s (wait for file sync completion)
          ├─ Check: transcription note already exists?
          └─ Process: transcribe → polish → create note → link to daily note
```

### "Unprocessed" Detection Logic

1. Get audio file's `ctime`
2. Format as `YYYYMMDD-HHmmss`
3. Check if `{voiceNoteFolder}/Transcription-YYYYMMDD-HHmmss.md` exists
4. If not → unprocessed

### Configuration

New setting in `PluginSettings`:

```typescript
enableAutoTranscription: boolean  // default: false
```

User enables it in Settings → General → "Auto transcribe new audio files".

### Error Handling

- Individual file failures don't block others
- Display Notice on failure
- No automatic retry (user can manually trigger batch process)
- `processing` Set prevents duplicate processing of same file

## Changes

### New Files

| File | Description |
|------|-------------|
| `src/managers/auto-transcription-manager.ts` | Auto transcription manager |
| `src/services/daily-note-link-service.ts` | Daily note link service (extracted from BatchManager) |

### Modified Files

| File | Changes |
|------|---------|
| `src/main.ts` | Initialize `AutoTranscriptionManager` and `DailyNoteLinkService` in `onload`, cleanup in `onunload` |
| `src/types/config.ts` | Add `enableAutoTranscription: boolean` to `PluginSettings` and `DEFAULT_SETTINGS` |
| `src/ui/settings/general-settings.ts` | Add toggle for auto transcription |
| `src/managers/batch-manager.ts` | Refactor to use `DailyNoteLinkService` instead of inline logic |

### Interface

```typescript
class AutoTranscriptionManager {
    private processing: Set<string>;
    
    constructor(
        app: App,
        settings: PluginSettings,
        transcriptionManager: TranscriptionManager,
        llmManager: LLMManager,
        noteService: TranscriptionNoteService,
        dailyNoteLinkService: DailyNoteLinkService
    );
    
    start(): void;      // Initial scan + register event listener
    stop(): void;       // Unregister event listener
    updateSettings(settings: PluginSettings): void;
    
    private scanAndProcessPending(): Promise<void>;
    private onFileCreated(file: TAbstractFile): void;
    private isUnprocessedAudio(file: TFile): Promise<boolean>;
    private processAudioFile(file: TFile): Promise<void>;
}

class DailyNoteLinkService {
    constructor(app: App);
    
    linkNotesToDailyNote(notes: TFile[]): Promise<void>;
    getOrCreateDailyNote(): Promise<TFile | null>;
}
```
