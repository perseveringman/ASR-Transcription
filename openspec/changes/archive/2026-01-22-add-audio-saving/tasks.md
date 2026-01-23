# Implementation Tasks

- [ ] 1. 更新配置定义
  - 在 `src/types/config.ts` 中增加 `audioSaveFolder`
  - 确保 `newNoteFolder` 逻辑清晰
- [ ] 2. 增强设置界面
  - 在 `src/ui/settings-tab.ts` 中增加录音保存文件夹的输入框
- [ ] 3. 实现音频文件持久化逻辑
  - 在 `src/main.ts` 的 `handleTranscription` 中，在转写前/后将 Blob 写入 Vault
  - 生成唯一文件名（如 `Recording-YYYYMMDD-HHmmss.wav`）
- [ ] 4. 优化文本插入
  - 转写结果中包含对新保存音频文件的引用（如 `![[Recording-xxx.wav]]`）
  - 确保转写笔记保存到配置的 `newNoteFolder`
- [ ] 5. 测试验证
  - 验证录音是否成功保存到指定文件夹
  - 验证转写笔记是否包含正确的音频引用
