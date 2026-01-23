# Obsidian ASR 语音转文字插件

[English](README.md) | 简体中文

一个为 Obsidian 打造的语音转文字插件，支持智谱 AI (Zhipu AI) 和火山引擎豆包 (Volcengine Doubao) 模型。

## 功能特性

- **语音录制**：直接在 Obsidian 中录制音频并实时转录。
- **文件转录**：支持对笔记中引用的音频文件或本地文件进行转录。
- **右键菜单支持**：在文件列表右键点击音频文件即可快速转录为新笔记。
- **多模型支持**：
  - **智谱 AI (GLM-ASR-2512)**：适合短语音（30秒以内自动切片），高性价比。
  - **火山引擎豆包 (标准版)**：支持长达 4 小时的长音频，单文件支持 512MB，适合会议、网课转录。
- **灵活插入**：支持插入到光标处、文档末尾或创建新笔记。
- **高度可定制**：支持时间戳、分隔符、热词、上下文提示词 (Context Prompt) 以及自定义模板。

## 安装方法

1. 在你的库 (Vault) 的 `.obsidian/plugins/` 目录下创建一个名为 `obsidian-asr` 的文件夹。
2. 将 `main.js`、`manifest.json` 和 `styles.css` 文件复制到该文件夹中。
3. 在 Obsidian 的"第三方插件"设置中启用该插件。

## 配置指南

你可以在插件设置中选择你偏好的服务商。

### 1. 智谱 AI (Zhipu AI) 设置
- **获取秘钥**：访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)。
- **开通服务**：注册并登录后，在控制台获取 `API Key`。
- **限制**：单段音频建议 30 秒以内（插件会自动为长音频进行切片处理）。

### 2. 火山引擎豆包 (Volcengine Doubao) 设置
- **获取秘钥**：访问 [火山引擎控制台](https://console.volcengine.com/)。
- **开通服务**：搜索"语音识别"并开通服务。
- **获取 App ID**：在"语音识别"控制台创建项目后即可获得 `App ID`。
- **获取 Access Token**：在控制台的"API Key 管理"中获取 `Access Token`。
- **资源授权**：确保已获得 `volc.seedasr.auc`（豆包录音文件识别模型 2.0 标准版）的调用权限。
- **优势**：单文件支持 512MB，时长最高支持 4 小时，无需手动切片。

## 使用方法

### 语音录制与转录
- 使用命令面板 (`Ctrl/Cmd + P`) 搜索 "Open transcription modal"。
- 点击 "Start Recording" 开始录音。
- 点击 "Stop Recording" 结束录音并触发转录。

### 转录笔记中引用的音频
- 在包含音频引用的笔记中，执行命令 "Transcribe referenced audio in current note"。
- 插件将识别笔记中的音频文件并将其转录结果插入下方。

### 右键快速转录
- 在 Obsidian 左侧文件列表中，右键点击任何音频文件（支持 mp3, wav, m4a, ogg 等）。
- 选择 "Transcribe audio"，插件将自动完成转录并根据模板创建一个新的 Markdown 笔记。

## 隐私说明

音频数据将上传至你选择的服务商（智谱 AI 或 火山引擎）进行处理。插件本身不会在本地存储之外的任何地方保留你的音频。

## 开源协议

MIT
