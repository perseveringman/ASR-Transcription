# Implementation Tasks

- [ ] 1. 实现 `AudioConverter` 工具类
  - 使用 `AudioContext.decodeAudioData` 解码音频
  - 实现 PCM 到 WAV 的编码逻辑
- [ ] 2. 在 `ASRPlugin` 中集成转换逻辑
  - 在 `handleTranscription` 和 `handleFileTranscription` 中检测文件类型
  - 如果是 m4a 或其他非原生支持格式，先调用转换工具
- [ ] 3. 更新 `ZhipuTranscriptionService` 确保发送转换后的 blob 并设置正确的 `audio.wav` 文件名
- [ ] 4. 验证 30 秒内的音频转换后大小是否在 25MB 以内 (WAV 格式)
