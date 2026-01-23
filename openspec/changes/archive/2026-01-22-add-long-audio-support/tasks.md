# Implementation Tasks

- [ ] 1. 扩展 `AudioConverter` 支持分段
  - 新增 `splitAudio` 方法，将长音频解码后切分为多个 `AudioBuffer`
  - 将每个切片编码为 WAV
- [ ] 2. 修改 `ZhipuTranscriptionService` 或创建包装类
  - 实现循环调用 API 转写多个片段
  - 合并转写文本
- [ ] 3. 调整 `AudioRecorder` 限制
  - 修改 `start` 方法中的 30s 自动停止逻辑（改为更大值，如 600s）
- [ ] 4. 优化 UI 反馈
  - 在转写过程中显示分段进度
- [ ] 5. 测试长音频 (例如 2 分钟音频) 的转写效果和稳定性
