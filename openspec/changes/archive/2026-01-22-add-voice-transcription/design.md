# 技术设计：Obsidian 语音转文字插件

## Context

### 背景
Obsidian 是一个基于 Markdown 的本地优先笔记应用，拥有强大的插件生态系统。本插件旨在为用户提供无缝的语音转文字体验，支持实时录制和文件上传两种输入方式。

### 约束
- **平台环境**：Obsidian 插件运行在 Electron/浏览器环境中
- **API 限制**：智谱 GLM-ASR-2512 模型限制音频文件 ≤ 25MB，时长 ≤ 30 秒
- **网络依赖**：转写功能需要互联网连接访问智谱 API
- **用户隐私**：音频文件会上传到第三方服务，需明确告知用户

### 利益相关者
- **最终用户**：Obsidian 使用者，需要快速记录语音内容
- **开发者**：需要维护和扩展插件功能
- **智谱 AI**：API 服务提供方

## Goals / Non-Goals

### Goals
- ✅ 提供简单易用的录制和上传界面
- ✅ 集成智谱 GLM-ASR-2512 API 进行高质量转写
- ✅ 支持灵活的文本插入位置配置
- ✅ 提供清晰的错误提示和加载状态反馈
- ✅ 设计可扩展的架构，便于后续接入其他转写服务

### Non-Goals
- ❌ 第一期不实现流式转写（留待第二期）
- ❌ 不实现音频文件的本地存储和管理
- ❌ 不实现离线转写能力
- ❌ 不实现音频编辑功能（剪辑、降噪等）
- ❌ 不实现多语言 UI（第一期仅英文）

## Architecture Overview

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                   Obsidian App                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Voice Transcription Plugin           │  │
│  │                                                   │  │
│  │  ┌─────────────┐      ┌──────────────────────┐   │  │
│  │  │ UI Layer    │      │  Service Layer       │   │  │
│  │  │             │      │                      │   │  │
│  │  │ - Recording │◄────►│ AudioRecorder        │   │  │
│  │  │   View      │      │ - start/stop/pause   │   │  │
│  │  │ - Settings  │      │ - MediaRecorder API  │   │  │
│  │  │   Tab       │      │                      │   │  │
│  │  │ - Commands  │      │ TranscriptionService │   │  │
│  │  │             │      │ (Abstract Interface) │   │  │
│  │  └─────────────┘      │   ▲                  │   │  │
│  │                       │   │                  │   │  │
│  │                       │   │ implements       │   │  │
│  │                       │   │                  │   │  │
│  │                       │  ZhipuAPI           │   │  │
│  │                       │  - transcribe()     │   │  │
│  │                       │  - HTTP client      │   │  │
│  │                       │  - error handling   │   │  │
│  │                       └──────────┬───────────┘   │  │
│  │                                  │               │  │
│  └──────────────────────────────────┼───────────────┘  │
└─────────────────────────────────────┼───────────────────┘
                                      │ HTTPS
                                      ▼
                    ┌──────────────────────────────┐
                    │  Zhipu AI Platform           │
                    │  open.bigmodel.cn            │
                    │  - GLM-ASR-2512 Model        │
                    └──────────────────────────────┘
```

### 模块职责

#### 1. UI Layer (用户界面层)
- **RecordingView**: 录制界面，包含录制按钮、进度显示、上传文件按钮
- **SettingsTab**: 设置面板，配置 API Key、插入位置、热词等
- **Commands**: Obsidian 命令注册，支持快捷键触发

#### 2. Service Layer (服务层)
- **AudioRecorder**: 
  - 封装浏览器 MediaRecorder API
  - 管理录制状态（idle/recording/paused/stopped）
  - 生成音频 Blob（MP3 或 WAV）
  
- **TranscriptionService** (抽象接口):
  ```typescript
  interface TranscriptionService {
    transcribe(audio: File | Blob, options?: TranscriptionOptions): Promise<TranscriptionResult>
    supportsStreaming(): boolean
  }
  ```

- **ZhipuAPI** (TranscriptionService 实现):
  - 实现智谱 API 的 HTTP 客户端
  - 处理 multipart/form-data 请求
  - 解析响应和错误码
  - 实现重试和超时逻辑

#### 3. Core Logic (核心逻辑)
- **TextInserter**: 根据配置策略插入文本到编辑器
- **ConfigManager**: 读写插件配置，验证配置项

## Decisions

### Decision 1: 服务提供商抽象层设计

**决策**: 使用策略模式 (Strategy Pattern) 抽象转写服务

**原因**:
- 便于后续接入其他 API（OpenAI Whisper、Azure Speech 等）
- 降低核心业务逻辑与具体 API 实现的耦合
- 方便编写单元测试（可 mock TranscriptionService）

**方案**:
```typescript
// src/services/transcription/types.ts
export interface TranscriptionService {
  name: string
  transcribe(audio: File | Blob, options?: TranscriptionOptions): Promise<TranscriptionResult>
  supportsStreaming(): boolean
}

// src/services/transcription/zhipu-api.ts
export class ZhipuTranscriptionService implements TranscriptionService {
  name = 'zhipu'
  // 实现细节...
}

// src/services/transcription/factory.ts
export class TranscriptionServiceFactory {
  static create(provider: string, config: ProviderConfig): TranscriptionService {
    switch(provider) {
      case 'zhipu': return new ZhipuTranscriptionService(config)
      // 未来扩展: case 'openai': return new OpenAITranscriptionService(config)
      default: throw new Error(`Unknown provider: ${provider}`)
    }
  }
}
```

**替代方案考虑**:
- ❌ 硬编码智谱 API：扩展性差，后续修改成本高
- ❌ 使用插件架构（动态加载）：第一期过度设计，增加复杂度

### Decision 2: 音频录制格式

**决策**: 优先使用 MP3 格式，降级到 WAV

**原因**:
- MP3 文件更小，减少网络传输时间和 API 成本
- 智谱 API 同时支持 MP3 和 WAV
- 浏览器 MediaRecorder 支持情况：
  - Chrome/Edge: 支持 `audio/webm` (需转换)
  - Safari: 支持 `audio/mp4`
  - Firefox: 支持 `audio/ogg`

**实现策略**:
```typescript
const supportedMimeTypes = [
  'audio/mp4',      // Safari
  'audio/webm',     // Chrome/Edge (需转 MP3)
  'audio/wav',      // 降级方案
]

const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type))
```

**后续优化**:
- 使用 Web Worker + FFmpeg.wasm 进行客户端格式转换
- 第一期：如果浏览器不支持 MP3，提示用户改用文件上传功能

### Decision 3: 文本插入位置策略

**决策**: 使用可配置的策略模式 + 默认值

**配置选项**:
```typescript
enum InsertPosition {
  CURSOR = 'cursor',           // 当前光标位置（默认）
  DOCUMENT_END = 'document-end', // 文档末尾
  NEW_NOTE = 'new-note'         // 新建笔记
}

interface InsertOptions {
  position: InsertPosition
  addTimestamp: boolean      // 是否添加时间戳
  addSeparator: boolean      // 是否添加分隔符
  newNoteFolder: string      // 新笔记保存文件夹
}
```

**实现**:
```typescript
class TextInserter {
  insert(text: string, options: InsertOptions) {
    switch(options.position) {
      case InsertPosition.CURSOR:
        this.insertAtCursor(text)
        break
      case InsertPosition.DOCUMENT_END:
        this.insertAtEnd(text)
        break
      case InsertPosition.NEW_NOTE:
        this.createNewNote(text, options.newNoteFolder)
        break
    }
  }
}
```

### Decision 4: 错误处理策略

**决策**: 分层错误处理 + 用户友好提示

**错误分类**:
```typescript
enum TranscriptionErrorType {
  NETWORK_ERROR = 'network_error',        // 网络连接失败
  API_ERROR = 'api_error',                // API 返回错误
  AUTH_ERROR = 'auth_error',              // API Key 无效
  FILE_TOO_LARGE = 'file_too_large',      // 文件超过 25MB
  DURATION_TOO_LONG = 'duration_too_long', // 时长超过 30 秒
  UNSUPPORTED_FORMAT = 'unsupported_format', // 不支持的格式
  RECORDING_ERROR = 'recording_error'     // 录制失败（权限等）
}
```

**处理流程**:
1. **捕获层**: 在 API 客户端捕获所有异常
2. **转换层**: 将 HTTP 错误码转换为业务错误类型
3. **展示层**: 根据错误类型显示用户友好的提示信息

**示例**:
```typescript
// Bad: 直接暴露技术细节
throw new Error('HTTP 401 Unauthorized')

// Good: 提供可操作的提示
throw new TranscriptionError(
  TranscriptionErrorType.AUTH_ERROR,
  '智谱 API Key 无效，请在设置中检查配置',
  { hint: '前往 https://open.bigmodel.cn 获取 API Key' }
)
```

### Decision 5: 状态管理

**决策**: 使用简单的事件驱动状态机

**录制状态流转**:
```
   [idle] ──start──► [recording] ──pause──► [paused]
                          │                     │
                          └──────stop───────────┘
                                  │
                                  ▼
                            [processing]
                                  │
                         ┌────────┴────────┐
                         │                 │
                      success           error
                         │                 │
                         ▼                 ▼
                      [idle]           [idle]
```

**实现**:
```typescript
class AudioRecorder extends EventEmitter {
  private state: RecordingState = RecordingState.IDLE
  
  start() {
    if (this.state !== RecordingState.IDLE) {
      throw new Error('Cannot start: recorder is busy')
    }
    this.state = RecordingState.RECORDING
    this.emit('statechange', this.state)
    // ...
  }
}
```

## Data Flow

### 录制转写流程

```
User Action: 点击录制按钮
     │
     ▼
AudioRecorder.start()
     │
     ▼
请求麦克风权限 (navigator.mediaDevices.getUserMedia)
     │
     ├─ 成功 ──► 开始录制
     │           │
     │           ▼
     │       User: 点击停止
     │           │
     │           ▼
     │       AudioRecorder.stop()
     │           │
     │           ▼
     │       生成 Blob (audio/mp4 或 audio/wav)
     │           │
     │           ▼
     │       TranscriptionService.transcribe(blob)
     │           │
     │           ▼
     │       HTTP POST to 智谱 API
     │           │
     │           ├─ 成功 ──► 解析 response.text
     │           │           │
     │           │           ▼
     │           │       TextInserter.insert(text)
     │           │           │
     │           │           ▼
     │           │       更新编辑器
     │           │           │
     │           │           ▼
     │           │       显示成功通知
     │           │
     │           └─ 失败 ──► 显示错误提示
     │
     └─ 失败 ──► 提示用户授权麦克风权限
```

### 文件上传转写流程

```
User Action: 点击上传按钮
     │
     ▼
文件选择对话框 (input[type=file])
     │
     ▼
验证文件
     │
     ├─ 格式不对 ──► 提示"仅支持 WAV/MP3"
     ├─ 大小超限 ──► 提示"文件不能超过 25MB"
     │
     └─ 通过 ──► TranscriptionService.transcribe(file)
                     │
                     ▼
                 (后续流程同上)
```

## API Integration Details

### 智谱 API 调用实现

```typescript
class ZhipuTranscriptionService implements TranscriptionService {
  private readonly baseURL = 'https://open.bigmodel.cn/api/paas/v4'
  private readonly apiKey: string
  
  async transcribe(
    audio: File | Blob, 
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    
    // 1. 构建 FormData
    const formData = new FormData()
    formData.append('file', audio, 'audio.mp3')
    formData.append('model', 'glm-asr-2512')
    formData.append('stream', 'false')
    
    if (options?.prompt) {
      formData.append('prompt', options.prompt)
    }
    
    if (options?.hotwords && options.hotwords.length > 0) {
      formData.append('hotwords', JSON.stringify(options.hotwords))
    }
    
    // 2. 发送请求
    const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    })
    
    // 3. 错误处理
    if (!response.ok) {
      const errorBody = await response.json()
      throw this.mapErrorToException(response.status, errorBody)
    }
    
    // 4. 解析响应
    const data = await response.json()
    return {
      text: data.text,
      requestId: data.request_id,
      model: data.model,
      duration: null // 智谱 API 不返回时长
    }
  }
  
  private mapErrorToException(status: number, body: any): TranscriptionError {
    if (status === 401) {
      return new TranscriptionError(
        TranscriptionErrorType.AUTH_ERROR,
        'API Key 无效或已过期'
      )
    }
    // ... 更多错误映射
  }
}
```

### API 重试策略

**场景**: 网络抖动或 API 临时不可用

**策略**: 指数退避重试 (Exponential Backoff)

```typescript
async transcribeWithRetry(
  audio: File | Blob,
  maxRetries = 3
): Promise<TranscriptionResult> {
  
  let lastError: Error
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await this.transcribe(audio)
    } catch (error) {
      lastError = error
      
      // 不可恢复的错误，立即失败
      if (error.type === TranscriptionErrorType.AUTH_ERROR ||
          error.type === TranscriptionErrorType.FILE_TOO_LARGE) {
        throw error
      }
      
      // 可恢复错误，等待后重试
      const delayMs = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
      await this.sleep(delayMs)
    }
  }
  
  throw lastError
}
```

## Security Considerations

### API Key 管理
- ✅ 存储在 Obsidian 的 data.json 中（自动加密）
- ✅ 在 UI 中使用 `type="password"` 隐藏输入
- ❌ 不在日志或错误信息中泄露完整 API Key
- ❌ 不在前端代码中硬编码 API Key

### 音频文件隐私
- ⚠️ 音频数据会上传到智谱服务器
- ✅ 在设置页面明确提示用户
- ✅ 提供隐私政策链接
- ❌ 第一期不实现本地缓存音频文件

### 网络安全
- ✅ 仅使用 HTTPS 连接
- ✅ 验证 API 响应的内容类型
- ✅ 限制请求超时时间（避免无限等待）

## Performance Considerations

### 优化目标
- 录制启动延迟 < 500ms
- 文件上传 + 转写耗时 < 5s（10 秒音频）
- UI 操作响应时间 < 100ms

### 优化策略

#### 1. 减少网络传输时间
- 使用 MP3 格式（比 WAV 小 10 倍）
- 支持压缩传输（gzip）

#### 2. 异步操作
```typescript
// 使用 async/await 避免阻塞 UI
async handleRecordingStop() {
  this.showLoadingIndicator()
  
  try {
    const blob = await this.recorder.getAudioBlob()
    const result = await this.transcriptionService.transcribe(blob)
    await this.insertText(result.text)
    this.showSuccessNotice()
  } catch (error) {
    this.showErrorNotice(error.message)
  } finally {
    this.hideLoadingIndicator()
  }
}
```

#### 3. 用户体验优化
- 显示上传进度条（使用 XMLHttpRequest.upload.onprogress）
- 显示转写中的动画提示
- 支持取消正在进行的请求

## Risks / Trade-offs

### Risk 1: 浏览器兼容性问题

**风险**: MediaRecorder API 在不同浏览器中的支持程度不同

**影响**: 部分用户可能无法使用录制功能

**缓解措施**:
- 在插件加载时检测 MediaRecorder API 支持情况
- 不支持时，禁用录制按钮并提示用户使用文件上传
- 提供兼容性说明文档

**降级方案**:
- 优先使用文件上传功能（兼容性最好）

### Risk 2: 智谱 API 可用性

**风险**: API 服务中断、限流、价格变动

**影响**: 转写功能完全不可用

**缓解措施**:
- 实现重试机制和超时控制
- 提供清晰的错误提示，引导用户检查网络
- 设计可扩展架构，便于切换到其他服务提供商

**长期计划**:
- 第二期支持多个转写服务提供商
- 允许用户配置备用 API

### Risk 3: 音频时长/大小限制

**风险**: 用户录制超过 30 秒或上传大于 25MB 的文件

**影响**: API 调用失败

**缓解措施**:
- 在录制界面显示剩余时间倒计时
- 接近 30 秒时自动停止录制
- 文件上传前验证大小，超限时拒绝上传
- 提示用户使用音频编辑工具分段处理长音频

### Risk 4: API 成本

**风险**: 用户频繁调用 API 导致成本过高

**影响**: 用户账单增加，可能放弃使用

**缓解措施**:
- 在设置页面提示 API 计费信息
- 显示每次转写的预估成本
- （可选）实现本地使用统计和成本预估

## Migration Plan

**不适用** - 这是全新的插件项目，无需迁移现有数据。

用户首次使用时的引导流程：
1. 安装插件后，显示欢迎页面
2. 引导用户配置智谱 API Key
3. 提供快速开始教程（录制 5 秒测试音频）

## Testing Strategy

### 单元测试
- `AudioRecorder`: 测试状态流转和事件触发
- `ZhipuTranscriptionService`: Mock HTTP 请求，测试响应解析和错误处理
- `TextInserter`: 测试不同插入位置策略

### 集成测试
- 完整录制 → 转写 → 插入流程
- 文件上传 → 转写 → 插入流程
- 各种错误场景（网络中断、API 失败、权限拒绝）

### 手动测试清单
- [ ] 在 Chrome/Edge 中测试录制功能
- [ ] 在 Safari 中测试录制功能
- [ ] 上传 10MB WAV 文件
- [ ] 上传 26MB 文件（应被拒绝）
- [ ] 录制 31 秒音频（应自动停止）
- [ ] 配置无效 API Key（应显示错误）
- [ ] 测试三种插入位置策略
- [ ] 测试热词功能

## Open Questions

### Q1: 是否需要支持音频预览？

**问题**: 转写前是否允许用户试听录制的音频？

**讨论**: 
- ✅ 优点：用户可以确认录音质量，避免浪费 API 调用
- ❌ 缺点：增加 UI 复杂度，延长操作流程

**决策**: **暂不实现**。第一期优先简化流程，后续根据用户反馈决定是否添加。

### Q2: 如何处理中文/多语言支持？

**问题**: 智谱 API 支持多语言，是否需要让用户指定音频语言？

**讨论**:
- 智谱 GLM-ASR-2512 支持自动语言检测
- 大多数用户录制单一语言

**决策**: **第一期不添加语言选项**，依赖 API 自动检测。如果用户反馈检测不准确，第二期添加手动语言选择。

### Q3: 热词配置的用户体验

**问题**: 热词配置如何设计既简单又强大？

**选项**:
- A. 在设置中配置全局热词列表（简单）
- B. 每次转写时弹窗输入热词（灵活但繁琐）
- C. 支持从当前笔记中自动提取关键词作为热词（智能但复杂）

**临时决策**: **选项 A**。第一期实现全局热词列表，用户可以在设置中添加常用专业术语。后续版本再考虑更智能的方案。

---

## Summary

本设计文档定义了 Obsidian 语音转文字插件的技术架构，核心决策包括：

1. **可扩展架构**: 使用抽象接口 `TranscriptionService` 支持未来接入多个 API
2. **简单优先**: 第一期聚焦核心功能，避免过度设计
3. **用户体验**: 清晰的状态反馈、友好的错误提示、灵活的配置选项
4. **健壮性**: 完善的错误处理、重试机制、边界检查

实现完成后，用户将能够在 Obsidian 中无缝完成"录制 → 转写 → 插入"的完整工作流。
