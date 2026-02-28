---
title: 语音转写
---

# 语音转写

## 实时录音转写

使用命令面板（`Ctrl/Cmd + P`）搜索 **Open transcription modal**，打开录音面板：

1. 点击 **Start Recording** 开始录音。
2. 录音过程中可看到实时计时。
3. 点击 **Stop Recording** 停止并自动开始转写。
4. 转写结果根据设置插入到光标处、文档末尾，或创建为新笔记。

## 转写笔记中引用的音频

如果你的笔记中已有音频引用（如 `![[recording.mp3]]`）：

1. 打开该笔记。
2. 执行命令 **Transcribe referenced audio in current note**。
3. 插件自动识别引用的音频并将转写结果插入其下方。

## 右键快速转写

在 Obsidian 左侧文件列表中：

1. 右键点击任何音频文件（支持 mp3, wav, m4a, ogg 等）。
2. 选择 **Transcribe audio**。
3. 插件完成转写后，根据模板自动创建一个新的 Markdown 笔记。

## 长音频支持

- **智谱 AI**：单段建议 30 秒以内，插件自动切片处理长音频。
- **火山引擎豆包**：原生支持最长 4 小时、单文件 512MB，无需切片。

## 支持的音频格式

mp3, wav, m4a, ogg, flac, aac, webm
