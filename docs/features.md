# Features Guide

This plugin has evolved beyond simple transcription into a comprehensive **AI Cognitive Engine** for Obsidian. It offers two main pillars of functionality: **Voice Capture (ASR)** and **AI Thinking (LLM Actions)**.

## 1. Voice Capture & Transcription (ASR)
Transform your voice into text with professional-grade accuracy.

*   **Real-time Recording**: Record directly within Obsidian.
*   **File Transcription**: Right-click any audio file to transcribe.
*   **Long Audio Support**: Automatically handles large files by chunking.
*   **Supported Providers**:
    *   **Zhipu AI (智谱)**: Cost-effective Chinese/English recognition.
    *   **Volcengine (火山引擎)**: High-accuracy Doubao models.

## 2. AI Polishing
Turn raw transcripts into polished prose.

*   **Cleanup**: Remove filler words ("um", "ah"), stuttering, and repetitions.
*   **Formatting**: Auto-punctuate and structure paragraphs.
*   **Custom Prompting**: Configure how the AI should polish your text.

## 3. AI Emergence (Thinking Actions)
The plugin includes a powerful **Action Manager** that acts as your "Second Brain," applying specific cognitive models to your notes.

These actions can be triggered on:
*   **Current Note**
*   **Selected Text**
*   **Current Folder** (Batch Processing)
*   **Specific Tag** (Batch Processing)
*   **Date Range** (Review Logic)

### 🧠 Thinking & Decision (思维决策)
*   **Value Clarification (价值澄清)**: Extracts core values, insights, and actionable guides from chaotic information.
*   **First Principles (第一性原理)**: Deconstructs complex topics into fundamental truths.
*   **Six Thinking Hats (六顶思考帽)**: Analyzes a topic from 6 distinct emotional and logical perspectives.
*   **Socratic Questioning (苏格拉底提问)**: Uses deep questioning to expose blind spots in your thinking.

### 📝 Content Processing (内容处理)
*   **Core Summary (核心摘要)**: Generates a structured summary with one-liner, key points, and conclusions.
*   **Task Extraction (待办提取)**: Identifies actionable items (Immediate vs. Follow-up) from notes.

### 💡 Creative Inspiration (创意启发)
*   **Perspective Collision (观点对撞)**: Generates opposing viewpoints to challenge your confirmation bias.
*   **Master Debate (大师辩论)**: Simulates a debate between 3 historical figures (e.g., Socrates, Nietzsche, Jobs) relevant to your topic.
*   **Poetic Gathering (诗人雅集)**: Invites famous poets to "rewrite" your note as a poem (supports cross-cultural styles).
*   **Mindmap Outline (思维导图大纲)**: Converts text into a Markdown list ready for mind-mapping tools.

### 🕸️ Knowledge Management (知识管理)
*   **Knowledge Link (知识连接)**: Finds cross-disciplinary connections to other fields.
*   **Concept Clarification (概念释义)**: Deeply defines and explains core concepts found in the text.

### 📚 Recommendation Engine (推荐内容)
*   **Book Recommendation (书单推荐)**: Suggests 3 deeply related books and 3 "Serendipity" (cross-field) books.
*   **Poetry Resonance (诗歌共鸣)**: Finds 3 matching poems and 3 contrasting poems to evoke emotion.
*   **Figure Connection (人物连接)**: Connects your thoughts to historical or modern figures.
*   **Media Recommendation (影音推荐)**: Suggests relevant movies, documentaries, or podcasts.

### 🔄 Reflection & Review (复盘)
*   **Daily Review (日评)**: Summarizes achievements and areas for improvement (Best used with Date Range).
*   **Weekly Review (周评)**: Analyzes weekly trends and high moments.
*   **Project AAR (项目复盘)**: Performs an After Action Review (Goal vs. Result vs. Learning).

## 4. Batch Processing
Apply any of the above "Thinking Actions" to **multiple notes at once**.
*   *Example*: Select a folder of daily notes and run "Weekly Review".
*   *Example*: Select a tag `#project-alpha` and run "Core Summary" to digest all related notes.
