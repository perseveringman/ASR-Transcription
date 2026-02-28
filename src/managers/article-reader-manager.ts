import { App, TFile, moment, Notice } from 'obsidian';
import { PluginSettings } from '../types/config';
import { ArticleContent, ArticleAnalysis } from '../types/article';
import { JinaArticleFetcher } from '../services/article/jina-article-fetcher';
import { LLMManager } from './llm-manager';

export class ArticleReaderManager {
    private app: App;
    private settings: PluginSettings;
    private llmManager: LLMManager;

    constructor(app: App, settings: PluginSettings, llmManager: LLMManager) {
        this.app = app;
        this.settings = settings;
        this.llmManager = llmManager;
    }

    updateSettings(settings: PluginSettings) {
        this.settings = settings;
    }

    /**
     * Check if a string contains a valid URL
     */
    extractUrl(text: string): string | null {
        const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
        const matches = text.match(urlRegex);
        return matches ? matches[0] : null;
    }

    /**
     * Check if Jina mode is enabled (has API key configured)
     */
    private useJinaMode(): boolean {
        return !!this.settings.jinaApiKey && this.settings.jinaApiKey.trim().length > 0;
    }

    /**
     * Process a URL: fetch, analyze, create note, return link
     */
    async processUrl(url: string): Promise<{ noteFile: TFile; link: string }> {
        const notice = new Notice('正在处理文章...', 0);

        try {
            let article: ArticleContent;
            let analysis: ArticleAnalysis;

            if (this.useJinaMode()) {
                // Mode 1: Use Jina to fetch, then analyze with LLM
                notice.setMessage('正在通过 Jina 获取内容...');
                const fetcher = new JinaArticleFetcher(this.settings.jinaApiKey);
                article = await fetcher.fetch(url);
                
                notice.setMessage('正在 AI 分析...');
                analysis = await this.analyzeArticle(article);
            } else {
                // Mode 2: Let LLM directly analyze the URL
                notice.setMessage('AI 正在分析链接...');
                const result = await this.analyzeUrlDirectly(url);
                article = result.article;
                analysis = result.analysis;
            }

            notice.setMessage('正在创建笔记...');

            // Create note file
            const noteFile = await this.createArticleNote(article, analysis);

            notice.hide();
            new Notice(`文章笔记已创建：${noteFile.basename}`);

            // Return link format
            const link = `[[${noteFile.basename}]]`;
            return { noteFile, link };

        } catch (error) {
            notice.hide();
            const message = error instanceof Error ? error.message : String(error);
            new Notice(`文章处理失败：${message}`);
            throw error;
        }
    }

    /**
     * Let LLM directly analyze the URL (for models that support web access)
     */
    private async analyzeUrlDirectly(url: string): Promise<{ article: ArticleContent; analysis: ArticleAnalysis }> {
        const systemPrompt = this.getDirectUrlSystemPrompt();
        
        const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: `请访问并分析这篇文章: ${url}` }
        ];

        const response = await this.llmManager.complete(messages);
        
        // Parse the response to extract article info and analysis
        const titleMatch = response.match(/##?\s*标题[：:]\s*(.+?)(?:\n|$)/i);
        const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
        
        const contentMatch = response.match(/##?\s*原文摘录[：:]\s*([\s\S]*?)(?=##?\s*摘要|$)/i);
        const content = contentMatch ? contentMatch[1].trim() : '';

        const article: ArticleContent = {
            url,
            title,
            content,
            siteName: new URL(url).hostname
        };

        const analysis = this.parseAnalysisResponse(response);
        
        return { article, analysis };
    }

    /**
     * Analyze article content with LLM (Jina mode)
     */
    private async analyzeArticle(article: ArticleContent): Promise<ArticleAnalysis> {
        const systemPrompt = this.settings.articleReaderSystemPrompt || this.getDefaultSystemPrompt();
        
        const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: `请分析以下文章:\n\n标题: ${article.title}\n\n内容:\n${article.content}` }
        ];

        const response = await this.llmManager.complete(messages);
        return this.parseAnalysisResponse(response);
    }

    /**
     * Parse LLM response into structured analysis
     */
    private parseAnalysisResponse(response: string): ArticleAnalysis {
        // Try to extract structured data from response
        const summaryMatch = response.match(/##?\s*摘要[：:]\s*([\s\S]*?)(?=##?\s*|$)/i) 
                          || response.match(/##?\s*Summary[：:]\s*([\s\S]*?)(?=##?\s*|$)/i);
        
        const keyPointsMatch = response.match(/##?\s*关键点[：:]\s*([\s\S]*?)(?=##?\s*|$)/i)
                            || response.match(/##?\s*Key\s*Points?[：:]\s*([\s\S]*?)(?=##?\s*|$)/i);
        
        const tagsMatch = response.match(/##?\s*标签[：:]\s*([\s\S]*?)(?=##?\s*|$)/i)
                       || response.match(/##?\s*Tags?[：:]\s*([\s\S]*?)(?=##?\s*|$)/i);

        const summary = summaryMatch ? summaryMatch[1].trim() : response.split('\n')[0];
        
        const keyPoints = keyPointsMatch 
            ? keyPointsMatch[1].split('\n')
                .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
                .map(line => line.replace(/^[-•]\s*/, '').trim())
            : [];

        const tags = tagsMatch
            ? tagsMatch[1].split(/[,，\s]+/)
                .map(tag => tag.replace(/^#/, '').trim())
                .filter(tag => tag.length > 0)
            : [];

        return { summary, keyPoints, tags };
    }

    /**
     * Create article note with frontmatter
     */
    private async createArticleNote(article: ArticleContent, analysis: ArticleAnalysis): Promise<TFile> {
        const folder = this.settings.articleNoteFolder || 'Articles';
        
        // Ensure folder exists
        if (!await this.app.vault.adapter.exists(folder)) {
            await this.app.vault.createFolder(folder);
        }

        // Generate safe filename
        const safeTitle = article.title
            .replace(/[\\/:*?"<>|]/g, '')
            .substring(0, 100);
        const timestamp = moment().format('YYYYMMDD-HHmmss');
        const fileName = `${safeTitle}-${timestamp}.md`;
        const filePath = `${folder}/${fileName}`;

        // Build frontmatter
        const frontmatter = [
            '---',
            `title: "${article.title.replace(/"/g, '\\"')}"`,
            `url: "${article.url}"`,
            `source: "${article.siteName || ''}"`,
            article.author ? `author: "${article.author}"` : null,
            article.publishDate ? `publish_date: "${article.publishDate}"` : null,
            `created: "${moment().format('YYYY-MM-DD HH:mm:ss')}"`,
            analysis.tags.length > 0 ? `tags:\n${analysis.tags.map(t => `  - ${t}`).join('\n')}` : null,
            '---'
        ].filter(Boolean).join('\n');

        // Build note content
        const content = [
            frontmatter,
            '',
            `# ${article.title}`,
            '',
            `> 原文链接: [${article.url}](${article.url})`,
            '',
            '## 摘要',
            '',
            analysis.summary,
            '',
            '## 关键点',
            '',
            analysis.keyPoints.map(p => `- ${p}`).join('\n') || '- 无',
            '',
            '## 原文内容',
            '',
            article.content
        ].join('\n');

        const file = await this.app.vault.create(filePath, content);
        return file;
    }

    private getDefaultSystemPrompt(): string {
        return `你是一个专业的文章阅读助手。请分析用户提供的文章，并按以下格式输出：

## 摘要:
用2-3句话概括文章的核心内容。

## 关键点:
- 列出文章的3-5个关键要点
- 每个要点用一句话描述

## 标签:
列出3-5个相关标签，用逗号分隔`;
    }

    private getDirectUrlSystemPrompt(): string {
        return `你是一个专业的文章阅读助手，可以访问网页内容。请访问用户提供的URL，阅读文章内容，并按以下格式输出：

## 标题:
文章的标题

## 原文摘录:
摘录文章的主要内容（保留关键段落）

## 摘要:
用2-3句话概括文章的核心内容。

## 关键点:
- 列出文章的3-5个关键要点
- 每个要点用一句话描述

## 标签:
列出3-5个相关标签，用逗号分隔`;
    }
}
