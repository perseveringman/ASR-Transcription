# 文档静态站设计方案

**日期**：2026-02-28
**状态**：已批准

## 背景

为 ASR-Transcription Obsidian 插件创建面向普通用户（中文）的文档静态站，使用 Docusaurus 框架，托管于 GitHub Pages。

## 方案选型

采用方案 A：在项目根目录下新建 `website/` 子目录，放置完整的 Docusaurus 项目，与插件源码完全隔离。

## 目录结构

```
ASR-Transcription/
├── website/                        # Docusaurus 项目
│   ├── docs/
│   │   ├── intro.md                # 简介
│   │   ├── installation.md         # 安装与快速入门
│   │   ├── features/
│   │   │   ├── transcription.md    # 语音转写
│   │   │   ├── ai-polish.md        # AI 润色
│   │   │   ├── thinking-actions.md # 思维动作
│   │   │   └── batch.md            # 批量处理
│   │   ├── providers/
│   │   │   ├── zhipu.md
│   │   │   ├── volcengine.md
│   │   │   └── ...
│   │   └── changelog.md
│   ├── src/pages/index.tsx         # 自定义 Landing page
│   ├── static/
│   ├── docusaurus.config.ts
│   ├── sidebars.ts
│   └── package.json
├── .github/workflows/
│   ├── release.yml                 # 已有，不变
│   └── deploy-docs.yml             # 新增
└── docs/                           # 保留，供开发者参考
```

## 站点配置

- **baseUrl**：`/ASR-Transcription/`
- **主题**：Docusaurus Classic，支持深色/浅色模式
- **语言**：`zh-Hans`
- **导航栏**：文档、更新日志、GitHub 链接
- **侧边栏**：自动生成，分组为「入门」「功能」「Provider 配置」「关于」
- **搜索**：`@docusaurus/plugin-search-local`（离线搜索）

## 内容迁移

| 来源 | 目标 |
|---|---|
| `README_CN.md` | `website/docs/installation.md` |
| `docs/features.md` | 拆分为 `website/docs/features/` 下多个文件 |
| `docs/providers.md` | 拆分为 `website/docs/providers/` 下各 provider 文件 |

原有 `docs/` 目录保留不删除。

## GitHub Actions 部署

文件：`.github/workflows/deploy-docs.yml`

- **触发**：push 到 `main`，变更路径为 `website/**` 或 `docs/**`
- **构建**：在 `website/` 目录执行 `pnpm install && pnpm build`
- **部署**：`peaceiris/actions-gh-pages` 推送 `website/build/` 到 `gh-pages` 分支
- **GitHub Pages 设置**：指向 `gh-pages` 分支根目录
