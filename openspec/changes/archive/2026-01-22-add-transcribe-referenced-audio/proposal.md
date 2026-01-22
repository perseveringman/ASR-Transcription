# Change: 增加转写当前笔记中引用音频文件的命令

## Why

用户在笔记中可能有已经存在的音频文件引用（如 `[[audio.mp3]]` 或 `![[audio.wav]]`）。目前用户需要打开转写模态框并再次手动上传这些文件，操作繁琐。通过增加一个直接转写当前笔记中引用音频的命令，可以极大地提升处理已有音频资料的效率。

## What Changes

本变更将增加以下功能：

- **扫描引用文件**：自动识别当前活动笔记中的所有音频文件引用。
- **快速转写命令**：增加一个 "Transcribe referenced audio in current note" 命令。
- **自动处理**：如果笔记中只有一个音频引用，直接开始转写；如果有多个，弹出选择框让用户选择。
- **结果插入**：将转写结果插入到对应引用位置的下方。

## Impact

### 受影响的规格 (Affected specs)
- `specs/transcription/spec.md` - 增加转写笔记中引用音频的场景。

### 受影响的代码 (Affected code)
- `src/main.ts` - 注册新命令。
- `src/services/text-inserter.ts` - 可能需要支持在特定位置插入（不仅仅是光标或末尾）。
- `src/ui/file-selection-modal.ts` (新) - 当有多个引用时让用户选择。
- `src/utils/vault-utils.ts` (新) - 处理文件扫描和读取。
