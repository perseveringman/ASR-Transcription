# Change: 修复转写文本插入位置错误的 Bug

## Why
当笔记中包含与音频文件名相似的内容（如 Frontmatter 中的日期 `2026-01-22`）时，当前的插入逻辑会错误地将转写文本插入到该内容下方，而不是真正的音频引用 `![[2026-01-22.m4a]]` 下方。这会导致转写结果破坏笔记结构（如插入到元信息中）。

## What Changes
- **精准匹配引用**：在查找插入位置时，不再只搜索文件名字符串，而是搜索标准的 Obsidian 引用格式 `[[filename]]` 或 `![[filename]]`。
- **防止干扰**：通过正则表达式匹配，确保只识别真正的链接引用，避免被 Frontmatter 或普通文本中的日期字符串干扰。

## Impact
### 受影响的规格 (Affected specs)
- `specs/transcription/spec.md` - 细化插入位置查找的场景。

### 受影响的代码 (Affected code)
- `src/services/text-inserter.ts` - 改进 `insert` 方法中的行查找逻辑。
