# Change: 增加音频格式转换功能 (m4a 转 wav)

## Why
智谱 API 对某些音频格式（如 m4a）的支持可能存在限制。为了确保转写成功率，对于浏览器能解码但 API 不一定支持的格式，我们需要在上传前将其转换为通用的 wav 格式。

## What Changes
- **新增音频转换工具**：实现 `AudioConverter` 类，利用 Web Audio API 将音频文件解码并编码为 wav 格式。
- **自动转换逻辑**：在上传或转写非 mp3/wav 格式的文件时，自动执行转换。
- **扩展支持格式**：正式支持 m4a 以及其他浏览器可播放的音频格式。

## Impact
### 受影响的规格 (Affected specs)
- `specs/transcription/spec.md` - 增加音频自动转换的场景。

### 受影响的代码 (Affected code)
- `src/services/audio-converter.ts` (新) - 核心转换逻辑。
- `src/main.ts` - 在调用转写服务前集成转换逻辑。
