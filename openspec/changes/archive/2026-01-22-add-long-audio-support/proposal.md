# Change: 支持长音频转写 (突破 30 秒限制)

## Why
智谱 API (GLM-ASR-2512) 单次请求限制音频时长不超过 30 秒。用户经常需要转写更长的语音。为了提升实用性，我们需要在插件中自动处理长音频。

## What Changes
- **自动分段转写**：当音频超过 30 秒时，自动将其切分为多个 ≤ 30 秒的片段。
- **并行/顺序处理**：依次或并发调用 API 转写每个片段，并按顺序合并结果。
- **解除录制限制**：将录制时长限制从 30 秒提升（例如 10 分钟或不设硬性限制，但需注意浏览器内存）。
- **进度反馈**：在转写长音频时，显示当前处理的片段进度（如 "Transcribing chunk 1/5..."）。

## Impact
### 受影响的规格 (Affected specs)
- `specs/transcription/spec.md` - 增加长音频分段转写的场景。

### 受影响的代码 (Affected code)
- `src/services/audio-converter.ts` - 增加分段切割逻辑。
- `src/services/transcription/zhipu-api.ts` 或新服务 - 实现分段调度逻辑。
- `src/services/audio-recorder.ts` - 调整或移除 30s 自动停止逻辑。
- `src/main.ts` - 协调长音频处理流程。
