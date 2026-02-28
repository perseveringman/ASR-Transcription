# Nextra 迁移 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `website/` 从 Docusaurus 3 完整迁移到 Nextra 2（基于 Next.js），保留所有现有文档内容，并更新 GitHub Actions 以适配 Next.js 静态导出。

**Architecture:** 删除 `website/` 目录下的 Docusaurus 项目，重新初始化为 Nextra 2 项目。所有 Markdown 文档内容从 `website/docs/` 迁移到 `website/pages/`，去掉 Docusaurus 专有的 frontmatter 字段（`sidebar_position`、`slug`），改用 `_meta.json` 控制侧边栏顺序。自定义首页改写为 MDX。

**Tech Stack:** Next.js 14, Nextra 2, `nextra-theme-docs`, TypeScript, GitHub Actions (`peaceiris/actions-gh-pages`)

---

### Task 1: 删除旧 Docusaurus 项目，初始化 Nextra

**Files:**
- Delete: `website/` 整个目录
- Create: `website/package.json`
- Create: `website/next.config.ts`
- Create: `website/tsconfig.json`
- Create: `website/.gitignore`

**Step 1: 删除旧 website 目录**

```bash
cd /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription
rm -rf website/
mkdir website
```

**Step 2: 创建 `website/package.json`**

```json
{
  "name": "aura-docs",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "nextra": "^2.13.4",
    "nextra-theme-docs": "^2.13.4",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=20.0"
  }
}
```

**Step 3: 创建 `website/next.config.ts`**

```typescript
import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
});

export default withNextra({
  output: 'export',
  basePath: '/Aura',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
});
```

**Step 4: 创建 `website/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 5: 创建 `website/.gitignore`**

```
node_modules/
.next/
out/
```

**Step 6: 安装依赖**

```bash
cd website && npm install
```

预期：`node_modules/` 生成，无报错。

**Step 7: 提交**

```bash
cd /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription
git add website/
git commit -m "feat: initialize Nextra website project"
```

---

### Task 2: 创建 theme.config.tsx 和 pages/_app.tsx

**Files:**
- Create: `website/theme.config.tsx`
- Create: `website/pages/_app.tsx`
- Create: `website/public/` (目录)

**Step 1: 创建 `website/theme.config.tsx`**

```tsx
import type { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 700 }}>Aura</span>,
  project: {
    link: 'https://github.com/perseveringman/Aura',
  },
  docsRepositoryBase: 'https://github.com/perseveringman/Aura',
  footer: {
    text: `Copyright © ${new Date().getFullYear()} Aura. Built with Nextra.`,
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Aura — Obsidian AI 认知引擎" />
    </>
  ),
  i18n: [],
  sidebar: {
    titleComponent({ title }) {
      return <>{title}</>;
    },
    defaultMenuCollapseLevel: 1,
  },
  navigation: true,
};

export default config;
```

**Step 2: 创建 `website/pages/_app.tsx`**

```tsx
import type { AppProps } from 'next/app';
import type { ReactElement } from 'react';

export default function App({ Component, pageProps }: AppProps): ReactElement {
  return <Component {...pageProps} />;
}
```

**Step 3: 创建 `website/public/` 目录（放 favicon）**

```bash
mkdir -p website/public
```

将 favicon 从旧 static 目录复制过来。因为旧目录已删除，创建一个占位（或跳过，Next.js 会使用默认 favicon）：

```bash
# 如果 git history 中还能找到旧 favicon，直接创建空目录即可
# favicon 不影响构建，可后续补充
mkdir -p /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription/website/public
```

**Step 4: 验证 TypeScript 无报错**

```bash
cd website && npx tsc --noEmit
```

预期：无报错。

**Step 5: 提交**

```bash
cd /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription
git add website/
git commit -m "feat: add Nextra theme config and app entry"
```

---

### Task 3: 创建顶层导航 _meta.json 和首页 index.mdx

**Files:**
- Create: `website/pages/_meta.json`
- Create: `website/pages/index.mdx`

**Step 1: 创建 `website/pages/_meta.json`**

```json
{
  "index": {
    "title": "首页",
    "type": "page",
    "display": "hidden"
  },
  "installation": "安装与快速入门",
  "features": "功能介绍",
  "providers": "Provider 配置",
  "changelog": "更新日志"
}
```

**Step 2: 创建 `website/pages/index.mdx`**

```mdx
---
title: Aura
---

import { Cards, Card } from 'nextra/components'

# Aura

**Obsidian AI 认知引擎** — 让每一个想法都能生长。

Aura 不只是转写工具，它是一条从**原始素材**到**深度洞见**的完整管线：

```
声音 / 文字  →  转写  →  润色  →  思维动作  →  洞见笔记
```

## 快速导航

<Cards>
  <Card title="安装与快速入门 →" href="/Aura/installation" />
  <Card title="功能介绍 →" href="/Aura/features/transcription" />
  <Card title="Provider 配置 →" href="/Aura/providers/overview" />
  <Card title="更新日志 →" href="/Aura/changelog" />
</Cards>

## 核心能力

- **语音转写**：录制音频或转写已有文件，支持智谱 AI 和火山引擎豆包
- **AI 润色**：从口语稿到书面文，自动清理填充词、修正断句
- **思维动作**：20+ 种认知模型，对任意笔记执行深度分析，生成结构化洞见
- **批量处理**：对整个文件夹、标签或日期范围批量执行任意动作
```

**Step 3: 提交**

```bash
cd /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription
git add website/pages/
git commit -m "feat: add Nextra top-level nav and homepage"
```

---

### Task 4: 迁移文档内容 — 入门 + 更新日志

**Files:**
- Create: `website/pages/installation.md`
- Create: `website/pages/changelog.md`

**说明：** Nextra 不需要 `sidebar_position`，也不使用 `slug: /`。只需删除这些 frontmatter 字段，其余内容完全复用。

**Step 1: 创建 `website/pages/installation.md`**

从 `website/docs/installation.md` 复制内容，去掉 `sidebar_position: 2` frontmatter（因为已由 `_meta.json` 控制顺序）。内容如下：

```markdown
---
title: 安装与快速入门
---

# 安装与快速入门

## 安装方法

### 方式一：手动安装（当前）

1. 前往 [GitHub Releases](https://github.com/perseveringman/Aura/releases) 下载最新版本的 `main.js`、`manifest.json`、`styles.css`。
2. 在你的 Obsidian 库（Vault）的 `.obsidian/plugins/` 目录下创建文件夹 `aura`。
3. 将三个文件放入该文件夹。
4. 打开 Obsidian → 设置 → 第三方插件 → 启用 **Aura**。

### 方式二：通过 BRAT 安装（Beta）

1. 先安装 [BRAT 插件](https://github.com/TfTHacker/obsidian42-brat)。
2. 在 BRAT 设置中添加仓库：`perseveringman/Aura`。
3. 在第三方插件中启用 **Aura**。

## 快速配置

安装后，至少需要配置一个 ASR 服务商才能开始使用：

1. 打开 Obsidian → 设置 → **Aura**。
2. 在"转录服务商"中选择 **智谱 AI** 或 **火山引擎**。
3. 填入对应的 API Key（详见 [Provider 配置](/Aura/providers/overview)）。

## 第一次转录

1. 使用命令面板（`Ctrl/Cmd + P`）搜索 **Open transcription modal**。
2. 点击 **Start Recording** 开始录音。
3. 点击 **Stop Recording** 结束录音，转录结果将自动插入当前笔记。

## 系统要求

- Obsidian 0.15.0 或更高版本
- 支持桌面端和移动端
- 需要网络连接（调用 ASR/LLM API）
```

**Step 2: 创建 `website/pages/changelog.md`**

```markdown
---
title: 更新日志
---

# 更新日志

## v1.1.0

- 品牌升级：插件更名为 **Aura**，定位从 STT 工具扩展为 AI 认知引擎
- 新增中文文档站（GitHub Pages）

## v1.0.6

- 自动转写：vault 启动时自动扫描音频并转写
- 自动链接每日笔记功能优化
- 设置页面体验优化

## v1.0.0

- 初始发布
- 支持智谱 AI 和火山引擎豆包语音转写
- AI 润色功能
- 20+ 思维动作
- 批量处理支持
```

**Step 3: 提交**

```bash
cd /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription
git add website/pages/
git commit -m "feat: migrate installation and changelog pages to Nextra"
```

---

### Task 5: 迁移功能介绍文档

**Files:**
- Create: `website/pages/features/_meta.json`
- Create: `website/pages/features/transcription.md`
- Create: `website/pages/features/ai-polish.md`
- Create: `website/pages/features/thinking-actions.md`
- Create: `website/pages/features/batch.md`

**Step 1: 创建 `website/pages/features/_meta.json`**

```json
{
  "transcription": "语音转写",
  "ai-polish": "AI 润色",
  "thinking-actions": "思维动作",
  "batch": "批量处理"
}
```

**Step 2: 创建 `website/pages/features/transcription.md`**

从 `website/docs/features/transcription.md` 复制，去掉 `sidebar_position`，加 `title` frontmatter：

```markdown
---
title: 语音转写
---

# 语音转写

## 实时录音转写

使用命令面板（`Ctrl/Cmd + P`）搜索 **Open transcription modal**，打开录音面板：

1. 点击 **Start Recording** 开始录音。
2. 录音过程中可看到实时计时。
3. 点击 **Stop Recording** 停止并自动开始转写。
4. 转写结果根据设置插入到光标处、文档末尾，或创建为新笔记。

## 转写笔记中引用的音频

如果你的笔记中已有音频引用（如 `![[recording.mp3]]`）：

1. 打开该笔记。
2. 执行命令 **Transcribe referenced audio in current note**。
3. 插件自动识别引用的音频并将转写结果插入其下方。

## 右键快速转写

在 Obsidian 左侧文件列表中：

1. 右键点击任何音频文件（支持 mp3, wav, m4a, ogg 等）。
2. 选择 **Transcribe audio**。
3. 插件完成转写后，根据模板自动创建一个新的 Markdown 笔记。

## 长音频支持

- **智谱 AI**：单段建议 30 秒以内，插件自动切片处理长音频。
- **火山引擎豆包**：原生支持最长 4 小时、单文件 512MB，无需切片。

## 支持的音频格式

mp3, wav, m4a, ogg, flac, aac, webm
```

**Step 3: 创建 `website/pages/features/ai-polish.md`**

```markdown
---
title: AI 润色
---

# AI 润色

将原始转写文本转化为流畅、结构清晰的书面内容。

## 润色内容

- **去除口语化**：自动删除"嗯"、"啊"、"那个"等填充词。
- **修正断句**：自动添加标点符号，整理段落结构。
- **自定义提示词**：你可以在设置中配置润色的风格和要求。

## 输出格式预设

在设置中可选择多种输出格式：

| 格式 | 适用场景 |
|---|---|
| 通用散文 | 日常笔记、想法记录 |
| 会议纪要 | 会议录音转写 |
| 社交媒体 | 生成朋友圈/公众号文案 |

## 配置方法

打开 Obsidian → 设置 → **Aura** → **AI 润色**，配置你的 LLM 服务商和自定义提示词。
```

**Step 4: 创建 `website/pages/features/thinking-actions.md`**

```markdown
---
title: 思维动作
---

# 思维动作

插件内置 **20+ 种认知模型**，可对笔记内容执行深度分析，生成结构化的洞见笔记。

## 触发方式

思维动作可以作用于：
- 当前笔记
- 选中文本
- 当前文件夹（批量）
- 特定标签（批量）
- 日期范围（复盘）

## 动作分类

### 🧠 思维决策

| 动作 | 说明 |
|---|---|
| 价值澄清 | 从混乱信息中提取核心价值观与行动指南 |
| 第一性原理 | 将复杂话题拆解为基本事实 |
| 六顶思考帽 | 从 6 个维度分析同一话题 |
| 苏格拉底提问 | 通过深层追问暴露思维盲点 |

### 📝 内容处理

| 动作 | 说明 |
|---|---|
| 核心摘要 | 生成一句话概括 + 关键点 + 结论 |
| 待办提取 | 识别笔记中的行动项（立即执行 vs 跟进） |

### 💡 创意启发

| 动作 | 说明 |
|---|---|
| 观点对撞 | 生成对立视角，挑战确认偏误 |
| 大师辩论 | 模拟 3 位历史人物围绕话题辩论 |
| 诗人雅集 | 邀请名人将你的笔记改写为诗歌 |
| 思维导图大纲 | 将文本转换为 Markdown 列表结构 |

### 🕸️ 知识管理

| 动作 | 说明 |
|---|---|
| 知识连接 | 寻找跨学科联系 |
| 概念释义 | 深度定义文本中的核心概念 |

### 📚 推荐内容

| 动作 | 说明 |
|---|---|
| 书单推荐 | 推荐 3 本强相关 + 3 本跨领域书籍 |
| 诗歌共鸣 | 推荐情感共鸣与对比诗歌各 3 首 |
| 人物连接 | 将你的想法与历史/当代人物关联 |
| 影音推荐 | 推荐相关电影、纪录片或播客 |

### 🔄 复盘

| 动作 | 说明 |
|---|---|
| 日评 | 总结当日成就与改进点 |
| 周评 | 分析本周趋势与高光时刻 |
| 项目复盘 | AAR 框架：目标 vs 结果 vs 学习 |
```

**Step 5: 创建 `website/pages/features/batch.md`**

```markdown
---
title: 批量处理
---

# 批量处理

对多篇笔记同时执行任意思维动作。

## 使用场景

- 对一个文件夹中所有日记执行"周评"
- 对标签 `#project-alpha` 下所有笔记执行"核心摘要"
- 对某个日期范围的笔记执行"项目复盘"

## 操作方式

1. 在命令面板中打开思维动作面板。
2. 选择目标范围：**文件夹 / 标签 / 日期范围**。
3. 选择要执行的动作。
4. 插件依次处理所有笔记，并为每篇生成一份洞见笔记（含元数据和反向链接）。
```

**Step 6: 提交**

```bash
cd /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription
git add website/pages/features/
git commit -m "feat: migrate features documentation to Nextra"
```

---

### Task 6: 迁移 Provider 配置文档

**Files:**
- Create: `website/pages/providers/_meta.json`
- Create: `website/pages/providers/overview.md`
- Create: `website/pages/providers/zhipu.md`
- Create: `website/pages/providers/volcengine.md`
- Create: `website/pages/providers/llm.md`

**Step 1: 创建 `website/pages/providers/_meta.json`**

```json
{
  "overview": "Provider 概览",
  "zhipu": "智谱 AI（ASR）",
  "volcengine": "火山引擎豆包（ASR）",
  "llm": "LLM Provider 配置"
}
```

**Step 2: 创建 `website/pages/providers/overview.md`**

```markdown
---
title: Provider 概览
---

# Provider 概览

Aura 依赖两类外部 AI 服务，各司其职：

| 类型 | 职责 | 支持的 Provider |
|---|---|---|
| **转写（ASR）** | 将音频转为原始文字 | 智谱 AI、火山引擎豆包 |
| **智能（LLM）** | AI 润色、思维动作 | OpenRouter、Gemini、DeepSeek、OpenAI、Anthropic、Minimax、智谱 GLM |

**最低配置：** 只配置 ASR Provider，即可使用语音转写功能。配置 LLM Provider 后，AI 润色和思维动作功能全部解锁。

## 推荐组合

| 使用场景 | 推荐 ASR | 推荐 LLM |
|---|---|---|
| 日常短录音 + 轻量润色 | 智谱 AI | DeepSeek |
| 会议/网课长录音 + 深度分析 | 火山引擎豆包 | OpenRouter（Claude） |
| 预算有限 | 智谱 AI | Gemini（免费额度） |
```

**Step 3: 创建 `website/pages/providers/zhipu.md`**

```markdown
---
title: 智谱 AI（ASR）
---

# 智谱 AI（ASR）

## 适用场景

- 中英文混合识别
- 短音频（30 秒以内效果最佳）
- 对成本敏感的场景

## 配置步骤

1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/) 注册并登录。
2. 在控制台获取 **API Key**。
3. 打开 Obsidian → 设置 → **Aura** → 转录服务商 → **智谱 AI**。
4. 粘贴 API Key 并保存。

## 注意事项

- 单段音频建议不超过 30 秒。
- 对于更长的音频，插件会自动分片处理，但处理时间会相应增加。
- 使用模型：**GLM-ASR-2512**
```

**Step 4: 创建 `website/pages/providers/volcengine.md`**

```markdown
---
title: 火山引擎豆包（ASR）
---

# 火山引擎豆包（ASR）

## 适用场景

- 长音频（会议录音、网课录音）
- 对识别精度要求高
- 单文件最大 512MB，时长最高 4 小时

## 配置步骤

1. 访问 [火山引擎控制台](https://console.volcengine.com/speech/service/8) 注册并登录。
2. 搜索"语音识别"并开通服务，获取 **App ID**。
3. 在控制台"API Key 管理"中获取 **Access Token**。
4. 确保已获得 `volc.seedasr.auc`（豆包录音文件识别模型 2.0 标准版）的调用权限。
5. 打开 Obsidian → 设置 → **Aura** → 转录服务商 → **火山引擎**。
6. 填入 **App ID** 和 **Access Token**，保存。

## 优势

- 原生支持长音频，无需手动切片
- 企业级识别精度
```

**Step 5: 创建 `website/pages/providers/llm.md`**

```markdown
---
title: LLM Provider 配置
---

# LLM Provider 配置

LLM Provider 用于 **AI 润色** 和 **思维动作**。

## OpenRouter（推荐）

通过一个 Key 访问 Claude、GPT-4o、Llama 3 等多种模型。

1. 访问 [openrouter.ai](https://openrouter.ai/) 获取 API Key。
2. 设置 → Intelligence → **OpenRouter**，填入 Key。
3. 推荐模型 ID：
   - `anthropic/claude-3.5-sonnet`（复杂思维动作）
   - `google/gemini-flash-1.5`（速度优先）

## Google Gemini

- 官网：[aistudio.google.com](https://aistudio.google.com/)
- 有免费额度，上下文窗口大，适合分析大量笔记。

## DeepSeek（深度求索）

- 官网：[platform.deepseek.com](https://platform.deepseek.com/)
- DeepSeek-V3/R1 推理能力强，成本极低，适合"第一性原理"等深度分析。

## 其他 Provider

| Provider | 适用场景 |
|---|---|
| OpenAI | 通用任务，稳定可靠 |
| Anthropic（直连） | 有 Claude 直接 API Key 时使用 |
| Minimax | 创意写作、角色扮演 |
| 智谱 GLM-4 | 中文通用性能好 |
```

**Step 6: 提交**

```bash
cd /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription
git add website/pages/providers/
git commit -m "feat: migrate providers documentation to Nextra"
```

---

### Task 7: 验证构建并更新 GitHub Actions

**Files:**
- Modify: `.github/workflows/deploy-docs.yml`

**Step 1: 验证本地 Next.js 构建**

```bash
cd /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription/website
npm run build
```

预期：在 `website/out/` 生成静态文件，无报错。

如果出现构建错误，常见问题处理：
- `Error: Cannot use next/image` → 确认 `next.config.ts` 中 `images: { unoptimized: true }` 已设置
- MDX 解析错误 → 检查 `pages/index.mdx` 中的 JSX 语法

**Step 2: 更新 `.github/workflows/deploy-docs.yml`**

将 `publish_dir` 从 `./website/build` 改为 `./website/out`：

```yaml
name: Deploy Docs to GitHub Pages

on:
  push:
    branches:
      - main
    paths:
      - 'website/**'
      - 'docs/**'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: website
        run: npm ci

      - name: Build website
        working-directory: website
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website/out
          publish_branch: gh-pages
```

**Step 3: 提交并推送**

```bash
cd /Users/ryanbzhou/Developer/vibe-coding/freedom/ASR-Transcription
git add website/ .github/workflows/deploy-docs.yml
git commit -m "feat: complete Nextra migration, update deploy workflow"
git push origin main
```

预期：GitHub Actions 触发，`Deploy Docs to GitHub Pages` workflow 绿色通过，文档站在 `https://perseveringman.github.io/Aura/` 正常显示。
