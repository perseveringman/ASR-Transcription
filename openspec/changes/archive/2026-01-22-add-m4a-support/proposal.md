# Change: 支持 m4a 音频格式转写

## Why
用户希望能够转写 m4a 格式的音频文件。当前插件在文件上传选择器中限制了仅支持 mp3 和 wav，且在调用 API 时固定了文件后缀。

## What Changes
- **扩展文件选择器**：在文件上传对话框中增加对 `.m4a` 文件的支持。
- **动态后缀处理**：在调用智谱 API 时，根据原始文件的类型或后缀设置正确的 Form Data 文件名，而不是硬编码为 `audio.mp3`。

## Impact
### 受影响的规格 (Affected specs)
- `specs/transcription/spec.md` - 增加 m4a 支持的描述。

### 受影响的代码 (Affected code)
- `src/ui/recording-view.ts` - 更新 `input.accept` 属性。
- `src/services/transcription/zhipu-api.ts` - 动态设置上传文件名。
