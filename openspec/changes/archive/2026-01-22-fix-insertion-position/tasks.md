# Implementation Tasks

- [ ] 1. 改进 `TextInserter` 的匹配逻辑
  - 使用正则表达式匹配 `[[filename]]` 或 `![[filename]]`
  - 确保匹配包含或不包含扩展名的情况
- [ ] 2. 验证修复效果
  - 在包含相同日期 Frontmatter 的笔记中测试，确保文本插入到引用下方
