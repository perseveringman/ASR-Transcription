# Change: 保存录音文件并支持自定义文件夹

## Why
目前插件在录音后仅进行转写，不保存原始音频文件。用户希望保留录音以备后续查证。同时，用户需要更灵活地配置录音文件和转写笔记的存放位置，以保持库的整洁。

## What Changes
- **保存录音文件**：录音完成后，自动将音频文件保存到 Obsidian 库中。
- **新增配置项**：
    - `audioSaveFolder`: 录音文件保存目录。
    - `transcriptionSaveFolder`: 转写笔记保存目录（重命名或扩展现有配置）。
- **关联引用**：转写完成后，在笔记中自动插入对保存好的录音文件的引用链接。
- **文件名策略**：使用时间戳生成唯一的录音文件名。

## Impact
### 受影响的规格 (Affected specs)
- `specs/audio-recording/spec.md` - 增加保存录音文件的要求。
- `specs/plugin-config/spec.md` - 增加文件夹配置项。

### 受影响的代码 (Affected code)
- `src/types/config.ts` - 更新设置定义。
- `src/ui/settings-tab.ts` - 增加文件夹设置 UI。
- `src/main.ts` - 在转写流程中加入保存文件的逻辑。
- `src/services/text-inserter.ts` - 调整插入逻辑以支持新文件夹配置。
