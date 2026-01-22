# Change: 添加语音转文字功能到 Obsidian 插件

## Why

用户在使用 Obsidian 记笔记时，经常需要将语音内容转换为文字记录。当前没有原生的语音转文字能力，用户需要在外部工具完成转写后再粘贴到 Obsidian 中，工作流程割裂且效率低下。通过提供集成的语音转文字插件，用户可以直接在 Obsidian 中录制音频或上传音频文件，并将转写结果自动插入到笔记中，极大提升记录效率。

## What Changes

本变更将创建一个全新的 Obsidian 插件，提供以下核心功能：

- **音频录制**：在编辑器中实时录制音频（支持 WAV/MP3 格式）
- **文件上传**：支持上传已有的音频文件进行转写
- **智谱 API 集成**：使用智谱 GLM-ASR-2512 模型进行语音转文字
- **灵活插入**：支持在光标位置、文档末尾插入转写文本，或创建新文档
- **配置管理**：在插件设置页面配置 API Key、插入位置策略、热词等参数
- **可扩展架构**：设计支持未来接入多种转写服务提供商

第一期实现范围：
- 基础录制和上传功能
- 同步转写（非流式）
- 智谱 GLM-ASR-2512 API 集成
- 基本的错误处理和用户反馈

后续版本计划：
- 流式转写（边录边转）
- 多服务提供商支持（OpenAI Whisper、Azure Speech 等）
- 高级功能（说话人分离、时间戳、段落识别）

## Impact

### 新增规格 (Affected specs)
- `specs/transcription/spec.md` - 语音转文字核心能力
- `specs/audio-recording/spec.md` - 音频录制和文件管理
- `specs/plugin-config/spec.md` - 插件配置管理

### 新增代码 (Affected code)
全新插件项目，主要文件结构：
- `src/main.ts` - 插件入口
- `src/services/transcription-service.ts` - 转写服务抽象层
- `src/services/zhipu-api.ts` - 智谱 API 客户端
- `src/services/audio-recorder.ts` - 音频录制服务
- `src/ui/recording-view.ts` - 录制界面
- `src/ui/settings-tab.ts` - 设置界面
- `src/types/` - TypeScript 类型定义
- `manifest.json` - 插件元数据
- `package.json` - 项目依赖

### 外部依赖
- 智谱 AI API (https://open.bigmodel.cn)
- 浏览器 MediaRecorder API (用于音频录制)
- Obsidian Plugin API

### 技术约束
- 音频文件大小限制：≤ 25 MB
- 音频时长限制：≤ 30 秒（智谱 API 限制）
- 支持的音频格式：WAV、MP3
- 需要用户提供有效的智谱 API Key

## Design Considerations

本变更需要 `design.md` 文档，因为涉及：
- 多模块架构设计（录制、转写、配置、UI）
- 外部 API 集成和错误处理策略
- 可扩展的服务提供商抽象层设计
- 用户体验流程和交互设计
