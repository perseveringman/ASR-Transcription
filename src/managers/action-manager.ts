import { App, MarkdownView, Notice, TFile, moment } from 'obsidian';
import { LLMManager } from './llm-manager';
import { RootCategory, AIAction, SourceConfig } from '../types/action';
import { PluginSettings } from '../types/config';
import { TimeRangeModal } from '../ui/modals/time-range-modal';

export class ActionManager {
    private categories: RootCategory[] = [];
    private settings: PluginSettings;

    constructor(private app: App, private llmManager: LLMManager, settings: PluginSettings) {
        this.settings = settings;
        this.loadDefaultActions();
    }

    public updateSettings(settings: PluginSettings) {
        this.settings = settings;
    }

    // ... loadDefaultActions ...
    private loadDefaultActions() {
        this.categories = [
            {
                id: 'emergence',
                name: 'AI 涌现', // Level 1: Root
                subCategories: [
                    {
                        id: 'thinking-decision',
                        name: '思维决策', // Level 2: Sub
                        actions: [ // Level 3: Actions
                            {
                                id: 'value-clarification',
                                name: '价值澄清', 
                                description: '分析内容，提取核心价值',
                                icon: 'star',
                                outputMode: 'new-note',
                                systemPrompt: this.getValueClarificationPrompt(),
                            },
                            {
                                id: 'first-principles',
                                name: '第一性原理',
                                description: '剥离表象，回归事物最原本的真理',
                                icon: 'box',
                                outputMode: 'new-note',
                                systemPrompt: this.getFirstPrinciplesPrompt(),
                            },
                            {
                                id: 'six-thinking-hats',
                                name: '六顶思考帽',
                                description: '全方位视角分析',
                                icon: 'hard-hat',
                                outputMode: 'new-note',
                                systemPrompt: this.getSixThinkingHatsPrompt(),
                            },
                            {
                                id: 'socratic-questioning',
                                name: '苏格拉底提问',
                                description: '通过追问发现盲点',
                                icon: 'help-circle',
                                outputMode: 'new-note',
                                systemPrompt: this.getSocraticQuestioningPrompt(),
                            }
                        ]
                    },
                    {
                        id: 'content-processing',
                        name: '内容处理',
                        actions: [
                            {
                                id: 'core-summary',
                                name: '核心摘要',
                                description: '提取要点并生成结构化摘要',
                                icon: 'list',
                                outputMode: 'new-note',
                                systemPrompt: this.getCoreSummaryPrompt(),
                            },
                            {
                                id: 'task-extraction',
                                name: '待办提取',
                                description: '识别并提取可执行的任务项',
                                icon: 'check-square',
                                outputMode: 'new-note',
                                systemPrompt: this.getTaskExtractionPrompt(),
                            }
                        ]
                    },
                    {
                        id: 'creative-inspiration',
                        name: '创意启发',
                        actions: [
                            {
                                id: 'perspective-collision',
                                name: '观点对撞',
                                description: '提供对立视角，激发辩证思考',
                                icon: 'zap',
                                outputMode: 'new-note',
                                systemPrompt: this.getPerspectiveCollisionPrompt(),
                            },
                            {
                                id: 'mindmap-outline',
                                name: '思维导图大纲',
                                description: '将内容转化为逻辑清晰的思维导图大纲',
                                icon: 'layout-list',
                                outputMode: 'new-note',
                                systemPrompt: this.getMindmapOutlinePrompt(),
                            }
                        ]
                    },
                    {
                        id: 'knowledge-management',
                        name: '知识管理',
                        actions: [
                            {
                                id: 'knowledge-link',
                                name: '知识连接',
                                description: '探索笔记与其它领域知识的关联',
                                icon: 'link',
                                outputMode: 'new-note',
                                systemPrompt: this.getKnowledgeLinkPrompt(),
                            },
                            {
                                id: 'concept-clarification',
                                name: '概念释义',
                                description: '提取并深度解析核心概念',
                                icon: 'book-open',
                                outputMode: 'new-note',
                                systemPrompt: this.getConceptClarificationPrompt(),
                            }
                        ]
                    },
                    {
                        id: 'reflection',
                        name: '复盘',
                        actions: [
                            {
                                id: 'daily-review',
                                name: '日评',
                                description: '回顾今日所得，总结经验教训',
                                icon: 'sun',
                                outputMode: 'new-note',
                                systemPrompt: this.getDailyReviewPrompt(),
                            },
                            {
                                id: 'weekly-review',
                                name: '周评',
                                description: '梳理本周进展，规划下周重点',
                                icon: 'calendar',
                                outputMode: 'new-note',
                                systemPrompt: this.getWeeklyReviewPrompt(),
                            },
                            {
                                id: 'project-aar',
                                name: '项目复盘',
                                description: '针对项目进行 AAR 复盘分析',
                                icon: 'target',
                                outputMode: 'new-note',
                                systemPrompt: this.getProjectAARPrompt(),
                            }
                        ]
                    }
                ]
            }
        ];
    }
    
    private getValueClarificationPrompt(): string {
        return `你是一个深度思考助手，擅长从杂乱的信息中提取核心价值。
Topic: [3-5个字的简短主题]
### 💎 价值澄清
**核心关注**：[总结]
**潜在洞察**：[深层分析]
**回归建议**：[行动指南]`;
    }

    private getFirstPrinciplesPrompt(): string {
        return `你是一个第一性原理思考者。将输入分解为最基本的真理，并从头开始重构理解。
Topic: [3-5个字的简短主题]
### 🧱 第一性原理分析
**解构**：...
**基本真理**：...
**重构**：...`;
    }

    private getSixThinkingHatsPrompt(): string {
        return `请通过“六顶思考帽”视角分析输入。
Topic: [3-5个字的简短主题]
### 🎩 六顶思考帽分析
**⚪ 白帽 (事实)**：...
**🔴 红帽 (情感)**：...
**⚫ 黑帽 (风险)**：...
**🟡 黄帽 (利益)**：...
**🟢 绿帽 (创意)**：...
**🔵 蓝帽 (管控)**：...`;
    }

    private getSocraticQuestioningPrompt(): string {
        return `扮演苏格拉底，通过追问发现盲点。
Topic: [3-5个字的简短主题]
### ❓ 苏格拉底式提问
[提出 5-7 个具有启发性的问题]`;
    }

    private getCoreSummaryPrompt(): string {
        return `你是一个信息精炼专家。请对用户笔记进行结构化摘要。
Topic: [3-5个字的简短主题]
### 📝 核心摘要
**一句话总结**：...
**关键要点**：
- ...
**核心结论**：...`;
    }

    private getTaskExtractionPrompt(): string {
        return `你是一个行动力教练。请从笔记中识别并提取所有可执行的任务项。
Topic: [3-5个字的简短主题]
### ✅ 待办提取
**立即执行**：
- [ ] ...
**后续跟进**：
- [ ] ...`;
    }

    private getPerspectiveCollisionPrompt(): string {
        return `你是一个辩证思考者。请针对用户笔记中的观点，提出 3 个有力的对立视角。
Topic: [3-5个字的简短主题]
### ⚡ 观点对撞
**原观点审视**：...
**对立视角**：...
**综合启发**：...`;
    }

    private getMindmapOutlinePrompt(): string {
        return `你是一个逻辑架构师。请将笔记内容转化为逻辑严密的思维导图大纲（Markdown 列表）。
Topic: [3-5个字的简短主题]
### 🗺️ 思维导图大纲
- 核心主题
    - 子分支...`;
    }

    private getKnowledgeLinkPrompt(): string {
        return `你是一个跨学科联想专家。请指出笔记内容可能与哪些其它领域的概念相关联。
Topic: [3-5个字的简短主题]
### 🔗 知识连接
**关联领域**：...
**启发联想**：...`;
    }

    private getConceptClarificationPrompt(): string {
        return `你是一个知识导师。请从笔记中提取核心概念，进行深度解析。
Topic: [3-5个字的简短主题]
### 📖 概念释义
**核心概念**：...
**深度解析**：...`;
    }

    private getDailyReviewPrompt(): string {
        return `你是一个复盘引导教练。请根据用户今日的笔记内容进行日评。
Topic: [3-5个字的简短主题]
### ☀️ 日评
**今日成就**：[总结今日值得肯定的点]
**关键收获**：[学到了什么新东西/什么深刻洞察]
**待改进点**：[哪些地方可以做得更好]
**明日重点**：[基于今日情况建议的明日核心任务]`;
    }

    private getWeeklyReviewPrompt(): string {
        return `你是一个个人增长顾问。请对用户本周的笔记内容进行周度深度复盘。
Topic: [3-5个字的简短主题]
### 📅 周评
**本周趋势**：[识别本周的核心关注点和趋势]
**高光时刻**：[本周最具价值的时刻或产出]
**阻碍与挑战**：[遇到的主要困难及原因分析]
**下周规划建议**：[基于本周复盘的下周策略性建议]`;
    }

    private getProjectAARPrompt(): string {
        return `你是一个项目管理专家。请使用 AAR (After Action Review) 方法对用户笔记中提到的项目/事件进行复盘。
Topic: [3-5个字的简短主题]
### 🎯 项目复盘 (AAR)
1. **预期目标**：[原本想要达成什么]
2. **实际结果**：[实际上发生了什么]
3. **差异分析**：[为什么会有差距？哪些做得好，哪些不好]
4. **经验总结**：[我们可以从中学到什么？下次如何改进]`;
    }

    public getCategories(): RootCategory[] {
        return this.categories;
    }

    private getActiveModelName(): string {
        const { llmProvider } = this.settings;
        switch (llmProvider) {
            case 'openrouter': return this.settings.openRouterModel;
            case 'gemini': return this.settings.geminiModel;
            case 'openai': return this.settings.openAIModel;
            case 'anthropic': return this.settings.anthropicModel;
            case 'zhipu': return this.settings.zhipuLLMModel;
            case 'minimax': return this.settings.minimaxModel;
            case 'deepseek': return this.settings.deepseekModel;
            default: return 'unknown';
        }
    }

    public async executeAction(action: AIAction, source: SourceConfig) {
        if (source.type === 'date-range') {
            new TimeRangeModal(this.app, (start, end) => {
                this.executeDateRangeAction(action, start, end);
            }).open();
            return;
        }

        // Default: current-note
        let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        
        // If focus is in sidebar, getActiveViewOfType might return null.
        // Try to get the active file and find its corresponding view.
        if (!activeView) {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile && activeFile.extension === 'md') {
                const leaves = this.app.workspace.getLeavesOfType('markdown');
                const matchingLeaf = leaves.find(l => (l.view as MarkdownView).file === activeFile);
                if (matchingLeaf) {
                    activeView = matchingLeaf.view as MarkdownView;
                }
            }
        }

        if (!activeView) {
            new Notice('No active Markdown file found.');
            return;
        }

        const editor = activeView.editor;
        const content = editor.getValue();
        
        if (!content.trim()) {
            new Notice('Note is empty.');
            return;
        }

        this.runLLM(action, content, activeView.file);
    }

    private async executeDateRangeAction(action: AIAction, start: moment.Moment, end: moment.Moment) {
        const files = this.fetchFilesByDateRange(start, end);
        if (files.length === 0) {
            new Notice('No notes found in the selected date range.');
            return;
        }

        new Notice(`Processing ${files.length} notes...`);

        let combinedContent = `Analysis Period: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\n\n`;
        for (const file of files) {
            const content = await this.app.vault.read(file);
            combinedContent += `\n\n--- Note: [[${file.basename}]] ---\n${content}`;
        }

        combinedContent += `\n\nIMPORTANT: You must start your response with "Topic: [3-5 Words Theme]" on the very first line.`;

        this.runLLM(action, combinedContent, null, files, start, end);
    }

    private fetchFilesByDateRange(start: moment.Moment, end: moment.Moment): TFile[] {
        const allFiles = this.app.vault.getMarkdownFiles();
        // Set start to beginning of day and end to end of day
        const startTime = start.clone().startOf('day').valueOf();
        const endTime = end.clone().endOf('day').valueOf();

        return allFiles.filter(file => {
            const ctime = file.stat.ctime;
            return ctime >= startTime && ctime <= endTime;
        });
    }

    private async runLLM(action: AIAction, content: string, sourceFile: TFile | null, sourceFiles: TFile[] = [], start?: moment.Moment, end?: moment.Moment) {
        new Notice(`Running AI Action: ${action.name}...`);

        try {
            const result = await this.llmManager.complete([
                { role: 'system', content: action.systemPrompt },
                { role: 'user', content: content }
            ]);

            await this.handleOutput(action, result, sourceFile, sourceFiles, start, end);
            new Notice('AI Action completed!');
        } catch (error) {
            console.error('AI Action failed:', error);
            const message = error instanceof Error ? error.message : String(error);
            new Notice(`AI Action failed: ${message}`);
        }
    }

    private async handleOutput(action: AIAction, text: string, sourceFile: TFile | null, sourceFiles: TFile[] = [], start?: moment.Moment, end?: moment.Moment) {
        // ... (existing logic for 'append'/'replace' if needed, but 'new-note' handles most)
        if (action.outputMode === 'new-note') {
            await this.createNewNote(action, text, sourceFile, sourceFiles, start, end);
            return;
        }
        
        // Fallback for current note append/replace
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && sourceFile && activeView.file === sourceFile) {
             const editor = activeView.editor;
             const formattedText = `\n\n${text}\n`;
             
             switch (action.outputMode) {
                case 'append': {
                    const lineCount = editor.lineCount();
                    editor.replaceRange(formattedText, { line: lineCount, ch: 0 });
                    break;
                }
                case 'replace':
                    editor.setValue(text);
                    break;
                default: {
                    const lineCountDef = editor.lineCount();
                    editor.replaceRange(formattedText, { line: lineCountDef, ch: 0 });
                }
            }
        }
    }

    private async createNewNote(action: AIAction, content: string, sourceFile: TFile | null, sourceFiles: TFile[] = [], start?: moment.Moment, end?: moment.Moment) {
        const folder = this.settings.aiActionNoteFolder || '思维涌现';
        
        // Ensure folder exists
        if (folder !== '/') {
            const folderExists = await this.app.vault.adapter.exists(folder);
            if (!folderExists) {
                await this.app.vault.createFolder(folder);
            }
        }

        // Parse Topic
        let topic = '';
        let cleanContent = content.trim();
        
        // Robust parsing: Look for Topic: line in the first 10 lines
        const lines = cleanContent.split('\n');
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const line = lines[i].trim();
            const match = line.match(/^Topic:\s*(.*)/i);
            if (match) {
                topic = match[1].trim();
                // Remove the topic line
                lines.splice(i, 1);
                cleanContent = lines.join('\n').trim();
                break;
            }
        }

        const timestamp = moment().format('YYYYMMDD-HHmmss');
        let filenameBase = action.name;
        
        if (start && end) {
            filenameBase += `-${start.format('YYYYMMDD')}-${end.format('YYYYMMDD')}`;
        } else if (sourceFile) {
            filenameBase += `-${sourceFile.basename}`;
        }
        
        const filename = `${filenameBase}-${timestamp}.md`;
        const path = folder === '/' ? filename : `${folder}/${filename}`;

        // Prepare content with frontmatter and backlink
        let finalContent = `---\ntags:\n  - AI涌现/${action.name}\n`;
        if (topic) {
            finalContent += `topic: ${topic}\n`;
        }
        finalContent += `model: ${this.getActiveModelName()}\n`;
        finalContent += `---\n\n`;

        if (sourceFile) {
            finalContent += `> [!info] Source: [[${sourceFile.path}|${sourceFile.basename}]]\n\n`;
        } else if (sourceFiles.length > 0) {
            finalContent += `> [!info] Analysis of ${sourceFiles.length} notes from ${start?.format('YYYY-MM-DD')} to ${end?.format('YYYY-MM-DD')}\n\n`;
        }
        
        finalContent += cleanContent;
        
        // Append list of source files if multiple
        if (sourceFiles.length > 0) {
            finalContent += `\n\n## References\n`;
            for (const file of sourceFiles) {
                finalContent += `- [[${file.path}|${file.basename}]]\n`;
            }
        }

        // Create the new note
        const newFile = await this.app.vault.create(path, finalContent);
        
        // Insert link to current note (only if single source)
        if (sourceFile) {
            // Try to find the view for the source file
            const leaves = this.app.workspace.getLeavesOfType('markdown');
            const sourceLeaf = leaves.find(l => (l.view as MarkdownView).file === sourceFile);
            
            if (sourceLeaf) {
                const editor = (sourceLeaf.view as MarkdownView).editor;
                const linkText = `\n\n[[${newFile.basename}|${action.name} Output]]\n`;
                const lineCount = editor.lineCount();
                editor.replaceRange(linkText, { line: lineCount, ch: 0 });
            }
        }

        // Open the new note in a split to the right
        const leaf = this.app.workspace.getLeaf('split', 'vertical');
        await leaf.openFile(newFile);
    }
}
