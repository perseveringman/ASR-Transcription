# Design: 转写笔记中引用的音频

## Context

Obsidian 提供了 `MetadataCache` 来获取笔记中的链接信息。我们可以利用这一点来高效地提取音频文件。

## Implementation Details

### 1. 链接识别策略
使用 `this.app.metadataCache.getCache(file.path)` 获取当前文件的缓存。
遍历 `links` 和 `embeds` 列表，检查链接文件的扩展名。

### 2. 插入策略优化
为了将转写结果精准插入到音频引用的下方，我们需要：
1. 获取当前编辑器的内容。
2. 定位音频链接字符串在文档中的行号。
3. 在该行下方插入转写文本。

### 3. 选择界面
使用 Obsidian 的 `SuggestModal` 来展示待选音频文件列表，提供更原生的交互体验。

## Risks
- 如果同一个音频文件被多次引用，可能需要去重。
- 链接路径可能是相对路径或绝对路径，需要使用 `app.metadataCache.getFirstLinkpathDest` 正确解析。
