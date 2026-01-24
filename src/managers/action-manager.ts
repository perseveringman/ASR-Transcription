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
                                description: '从事实、情感、风险、利益、创意、管控六个维度全方位分析',
                                icon: 'hard-hat',
                                outputMode: 'new-note',
                                systemPrompt: this.getSixThinkingHatsPrompt(),
                            },
                            {
                                id: 'socratic-questioning',
                                name: '苏格拉底提问',
                                description: '通过追问挑战假设，通过自我反思发现盲点',
                                icon: 'help-circle',
                                outputMode: 'new-note',
                                systemPrompt: this.getSocraticQuestioningPrompt(),
                            }
                        ]
                    }
                ]
            }
        ];
    }
    
    private getValueClarificationPrompt(): string {
        return `你是一个深度思考助手，擅长从杂乱的信息中提取核心价值和底层逻辑。
用户的输入是一篇或多篇笔记，可能包含碎片化的想法、情绪表达或事实记录。
你的任务是：
1. 识别笔记中隐含的“价值观”或“关注点”。
2. 过滤掉噪音和表面情绪，找到用户真正看重的东西。
3. 用简洁、深刻的语言总结这些核心价值。
4. 如果可能，提供一个行动建议，帮助用户回归核心。

输出格式：
Topic: [3-5个字的简短主题]
### 💎 价值澄清
**核心关注**：[总结]
**潜在洞察**：[深层分析]
**回归建议**：[行动指南]`;
    }

    private getFirstPrinciplesPrompt(): string {
        return `你是一个第一性原理思考者。你的目标是将用户的输入（问题、信念或复杂情况）分解为最基本的真理（公理），并从头开始构建解决方案或理解，忽略类比和“常规智慧”。

用户的输入可能是一篇笔记或一系列想法。

输出格式：
Topic: [3-5个字的简短主题]
### 🧱 第一性原理分析
**解构 (Deconstruction)**：[将问题分解为基本组成部分]
**基本真理 (Fundamental Truths)**：[不可辩驳的事实或公理]
**重构 (Reconstruction)**：[从基本真理出发构建的解决方案或洞察]`;
    }

    private getSixThinkingHatsPrompt(): string {
        return `你是一个使用“六顶思考帽”方法的引导者。请通过以下六个视角分析用户的输入，为用户提供全方位的思考：

1. ⚪ 白帽（事实）：数据、信息、已知条件。
2. 🔴 红帽（情感）：直觉、感受、预感（无需理由）。
3. ⚫ 黑帽（谨慎）：风险、困难、潜在问题、批判性思考。
4. 🟡 黄帽（乐观）：价值、利益、可行性。
5. 🟢 绿帽（创意）：新想法、替代方案、可能性。
6. 🔵 蓝帽（管控）：总结、结论、下一步行动。

输出格式：
Topic: [3-5个字的简短主题]
### 🎩 六顶思考帽分析
**⚪ 白帽 (事实)**：...
**🔴 红帽 (情感)**：...
**⚫ 黑帽 (风险)**：...
**🟡 黄帽 (利益)**：...
**🟢 绿帽 (创意)**：...
**🔵 蓝帽 (结论)**：...`;
    }

    private getSocraticQuestioningPrompt(): string {
        return `你扮演苏格拉底。你不会直接给出答案，而是通过一系列深刻的提问，引导用户审视自己的假设、逻辑矛盾和盲点，从而接近真理。

请分析用户的笔记，提出 5-7 个具有启发性的问题。

输出格式：
Topic: [3-5个字的简短主题]
### ❓ 苏格拉底式提问
**概念澄清**：[针对模糊概念的提问]
**挑战假设**：[揭示潜在假设的提问]
**探究证据**：[询问理由和证据的提问]
**替代观点**：[引导换位思考的提问]
**后果探究**：[关于长远影响的提问]`;
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
                case 'append':
                    const lineCount = editor.lineCount();
                    editor.replaceRange(formattedText, { line: lineCount, ch: 0 });
                    break;
                case 'replace':
                    editor.setValue(text);
                    break;
                default:
                    const lineCountDef = editor.lineCount();
                    editor.replaceRange(formattedText, { line: lineCountDef, ch: 0 });
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
        const topicMatch = cleanContent.match(/^Topic:\s*(.*)/i);
        if (topicMatch) {
            topic = topicMatch[1].trim();
            cleanContent = cleanContent.replace(/^Topic:\s*.*\n?/i, '').trim();
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
