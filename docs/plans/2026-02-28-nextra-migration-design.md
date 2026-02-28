# Nextra 迁移设计方案

**日期**：2026-02-28
**状态**：已批准

## 背景

将 `website/` 从 Docusaurus 3 迁移到 Nextra 2（基于 Next.js），保留所有现有 Markdown 文档内容。

## 架构

用 Nextra `docs` 主题替换 Docusaurus。Nextra 用 `_meta.json` 控制侧边栏和导航顺序，所有 `.md`/`.mdx` 文件直接映射为页面。

### 目录结构

```
website/
├── pages/
│   ├── _meta.json             ← 顶层导航顺序
│   ├── index.mdx              ← 自定义首页（Landing Page）
│   ├── installation.md
│   ├── features/
│   │   ├── _meta.json
│   │   ├── transcription.md
│   │   ├── ai-polish.md
│   │   ├── thinking-actions.md
│   │   └── batch.md
│   ├── providers/
│   │   ├── _meta.json
│   │   ├── overview.md
│   │   ├── zhipu.md
│   │   ├── volcengine.md
│   │   └── llm.md
│   └── changelog.md
├── public/                    ← 静态资源（原 static/img/）
├── theme.config.tsx           ← 站点标题、导航栏、页脚
├── next.config.ts
├── package.json
└── tsconfig.json
```

### 内容迁移

所有 Markdown 文件直接复用，去掉 Docusaurus 特有的 frontmatter 字段（`sidebar_position`、`slug`），改用 `_meta.json` 控制顺序。

### 搜索

Nextra 内置 Flexsearch 离线搜索，开箱即用。

### GitHub Actions

`deploy-docs.yml` 更新：
- 构建命令：`next build`
- 产物目录：`website/out/`（Next.js 静态导出）

## 不变的内容

- 所有 Markdown 文档文字内容
- GitHub Actions 触发条件（`website/**` 变更）
- GitHub Pages 部署目标（`gh-pages` 分支）
- 文档站 URL（`perseveringman.github.io/Aura/`）
