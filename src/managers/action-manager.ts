import { App, MarkdownView, Notice, TFile, moment } from 'obsidian';
import { LLMManager } from './llm-manager';
import { ActionCategory, AIAction } from '../types/action';
import { PluginSettings } from '../types/config';

export class ActionManager {
    private categories: ActionCategory[] = [];
    private settings: PluginSettings;

    constructor(private app: App, private llmManager: LLMManager, settings: PluginSettings) {
        this.settings = settings;
        this.loadDefaultActions();
    }

    public updateSettings(settings: PluginSettings) {
        this.settings = settings;
    }

    private loadDefaultActions() {
        this.categories = [
            {
                id: 'emergence',
                name: 'AI 涌现能力', // Emergent Capabilities
                actions: [
                    {
                        id: 'value-clarification',
                        name: '价值澄清', // Value Clarification
                        description: '从笔记里找出你真正看重的东西，从混乱回到核心',
                        icon: 'star',
                        outputMode: 'new-note',
                        systemPrompt: `你是一个深度思考助手，擅长从杂乱的信息中提取核心价值和底层逻辑。
用户的输入是一篇笔记，可能包含碎片化的想法、情绪表达或事实记录。
你的任务是：
1. 识别笔记中隐含的“价值观”或“关注点”。
2. 过滤掉噪音和表面情绪，找到用户真正看重的东西。
3. 用简洁、深刻的语言总结这些核心价值。
4. 如果可能，提供一个行动建议，帮助用户回归核心。

输出格式：
### 💎 价值澄清
**核心关注**：[总结]
**潜在洞察**：[深层分析]
**回归建议**：[行动指南]`,
                    }
                ]
            }
        ];
    }

    public getCategories(): ActionCategory[] {
        return this.categories;
    }

    public async executeAction(action: AIAction) {
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

        new Notice(`Running AI Action: ${action.name}...`);

        try {
            const result = await this.llmManager.complete([
                { role: 'system', content: action.systemPrompt },
                { role: 'user', content: content }
            ]);

            await this.handleOutput(action, result, activeView);
            new Notice('AI Action completed!');
        } catch (error) {
            console.error('AI Action failed:', error);
            const message = error instanceof Error ? error.message : String(error);
            new Notice(`AI Action failed: ${message}`);
        }
    }

    private async handleOutput(action: AIAction, text: string, view: MarkdownView) {
        const editor = view.editor;

        if (action.outputMode === 'new-note') {
            await this.createNewNote(action, text, view.file);
            return;
        }

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

    private async createNewNote(action: AIAction, content: string, sourceFile: TFile | null) {
        const folder = this.settings.aiActionNoteFolder || '思维涌现';
        
        // Ensure folder exists
        if (folder !== '/') {
            const folderExists = await this.app.vault.adapter.exists(folder);
            if (!folderExists) {
                await this.app.vault.createFolder(folder);
            }
        }

        const timestamp = moment().format('YYYYMMDD-HHmmss');
        const sourceName = sourceFile ? sourceFile.basename : 'Untitled';
        const filename = `${action.name}-${sourceName}-${timestamp}.md`;
        const path = folder === '/' ? filename : `${folder}/${filename}`;

        // Prepare content with frontmatter and backlink
        let finalContent = `---\ntags:\n  - AI涌现/${action.name}\n---\n\n`;
        if (sourceFile) {
            finalContent += `> [!info] Source: [[${sourceFile.path}|${sourceFile.basename}]]\n\n`;
        }
        finalContent += content;

        // Create the new note
        const newFile = await this.app.vault.create(path, finalContent);
        
        // Insert link to current note
        if (sourceFile) {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView && activeView.file === sourceFile) {
                const editor = activeView.editor;
                const linkText = `\n\n[[${newFile.basename}|${action.name} Output]]\n`;
                const lineCount = editor.lineCount();
                editor.replaceRange(linkText, { line: lineCount, ch: 0 });
            }
        }

        // Open the new note in a split to the right? Or just notify?
        // User didn't specify, but opening it is usually helpful.
        // Let's open it in a new leaf to the right.
        const leaf = this.app.workspace.getLeaf('split', 'vertical');
        await leaf.openFile(newFile);
    }
}
