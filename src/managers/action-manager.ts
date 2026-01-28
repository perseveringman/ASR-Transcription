import { App, MarkdownView, Notice, TFile, moment, TFolder } from 'obsidian';
import { LLMManager } from './llm-manager';
import { RootCategory, AIAction, SourceConfig } from '../types/action';
import { PluginSettings } from '../types/config';
import { TimeRangeModal } from '../ui/modals/time-range-modal';
import { TagSelectionModal } from '../ui/modals/tag-selection-modal';
import { ExtractedMetadata } from '../types/metadata';
import { safeParseJson } from '../utils/json-utils';

export class ActionManager {
    private categories: RootCategory[] = [];
    private settings: PluginSettings;

    constructor(
        private app: App,
        private llmManager: LLMManager,
        settings: PluginSettings,
        private saveSettings?: () => Promise<void>
    ) {
        this.settings = settings;
        this.loadDefaultActions();
    }

    public updateSettings(settings: PluginSettings) {
        this.settings = settings;
    }

    public getMostFrequentActions(limit: number = 4): AIAction[] {
        const counts = this.settings.actionUsageCounts || {};
        const allActions: AIAction[] = [];
        
        // Flatten all actions
        for (const root of this.categories) {
            for (const sub of root.subCategories) {
                allActions.push(...sub.actions);
            }
        }

        // Sort by usage count (descending)
        return allActions
            .filter(action => (counts[action.id] || 0) > 0)
            .sort((a, b) => {
                const countA = counts[a.id] || 0;
                const countB = counts[b.id] || 0;
                return countB - countA;
            })
            .slice(0, limit);
    }

    private async recordActionUsage(actionId: string) {
        if (!this.settings.actionUsageCounts) {
            this.settings.actionUsageCounts = {};
        }
        
        this.settings.actionUsageCounts[actionId] = (this.settings.actionUsageCounts[actionId] || 0) + 1;
        
        if (this.saveSettings) {
            await this.saveSettings();
        }
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
                                id: 'extract-metadata',
                                name: '提取元数据',
                                description: '自动分析笔记并填充 Frontmatter',
                                icon: 'file-json',
                                outputMode: 'frontmatter',
                                systemPrompt: this.getMetadataExtractionPrompt(),
                            },
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
                                id: 'master-debate',
                                name: '大师辩论',
                                description: '模拟多位大师针对内容进行深度辩论',
                                icon: 'users',
                                outputMode: 'new-note',
                                systemPrompt: this.getMasterDebatePrompt(),
                            },
                            {
                                id: 'poetic-gathering',
                                name: '诗人雅集',
                                description: '邀请不同流派诗人重构内容并互评',
                                icon: 'feather',
                                outputMode: 'new-note',
                                systemPrompt: this.getPoeticGatheringPrompt(),
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
                        id: 'recommendation',
                        name: '推荐内容',
                        actions: [
                            {
                                id: 'book-recommendation',
                                name: '书单推荐',
                                description: '基于笔记内容推荐相关的经典书籍',
                                icon: 'book',
                                outputMode: 'new-note',
                                systemPrompt: this.getBookRecommendationPrompt(),
                            },
                            {
                                id: 'poetry-recommendation',
                                name: '诗歌共鸣',
                                description: '寻找与笔记意境共鸣的经典诗歌',
                                icon: 'scroll',
                                outputMode: 'new-note',
                                systemPrompt: this.getPoetryRecommendationPrompt(),
                            },
                            {
                                id: 'figure-recommendation',
                                name: '人物连接',
                                description: '推荐思想契合或经历相关的历史/现代人物',
                                icon: 'user-plus',
                                outputMode: 'new-note',
                                systemPrompt: this.getFigureRecommendationPrompt(),
                            },
                            {
                                id: 'media-recommendation',
                                name: '影音推荐',
                                description: '推荐相关的电影、纪录片或播客',
                                icon: 'film',
                                outputMode: 'new-note',
                                systemPrompt: this.getMediaRecommendationPrompt(),
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
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 💎 价值澄清
**核心关注**：[总结]
**潜在洞察**：[深层分析]
**回归建议**：[行动指南]`;
    }

    private getFirstPrinciplesPrompt(): string {
        return `你是一个第一性原理思考者。将输入分解为最基本的真理，并从头开始重构理解。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 🧱 第一性原理分析
**解构**：...
**基本真理**：...
**重构**：...`;
    }

    private getSixThinkingHatsPrompt(): string {
        return `请通过“六顶思考帽”视角分析输入。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
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
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### ❓ 苏格拉底式提问
[提出 5-7 个具有启发性的问题]`;
    }

    private getCoreSummaryPrompt(): string {
        return `你是一个信息精炼专家。请对用户笔记进行结构化摘要。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 📝 核心摘要
**一句话总结**：...
**关键要点**：
- ...
**核心结论**：...`;
    }

    private getTaskExtractionPrompt(): string {
        return `你是一个行动力教练。请从笔记中识别并提取所有可执行的任务项。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### ✅ 待办提取
**立即执行**：
- [ ] ...
**后续跟进**：
- [ ] ...`;
    }

    private getPerspectiveCollisionPrompt(): string {
        return `你是一个辩证思考者。请针对用户笔记中的观点，提出 3 个有力的对立视角。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### ⚡ 观点对撞
**原观点审视**：...
**对立视角**：...
**综合启发**：...`;
    }

    private getMasterDebatePrompt(): string {
        return `你是一个跨时空思想辩论的主持人。请根据用户的笔记内容，邀请 3 位历史上最相关的大师/思想家（例如苏格拉底、孔子、尼采、德鲁克、乔布斯等，具体人选由你根据内容决定），针对笔记中的核心观点进行一场激烈的辩论。

Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 🗣️ 大师辩论
**主持人开场**：[简要介绍背景和辩题]
**第一轮：观点阐述**
- 🧙‍♂️ **[大师A]**：...
- 🧙‍♀️ **[大师B]**：...
- 🧙 **[大师C]**：...

**第二轮：交锋与反驳**
- [大师A] 回应 [大师B/C]：...
- ...

**主持人总结**：
**综合洞察**：[辩论带来的新视角]
**最终建议**：[融合各方智慧的建议]`;
    }

    private getPoeticGatheringPrompt(): string {
        return `你是一位跨越时空的诗社社长。请根据用户的笔记内容，邀请 3-5 位不同流派/时代的大诗人（例如李白、苏轼、泰戈尔、艾米莉·狄金森、波德莱尔、海子、里尔克等，需风格迥异），**基于笔记的深层意蕴，模仿他们的风格创作一首全新的诗歌**。

**⚠️ 关键要求 (Critical Instructions)：**
1.  **严禁抄袭原作**：绝对不能直接引用该诗人的既有成名作，必须是**全新的原创**。
2.  **拒绝机械复述**：不要出现笔记中的原话。请**意会**笔记的核心思想、情绪或哲理，将其升华为更高层次的**抽象表达**和**艺术隐喻**。
3.  **拒绝打油诗**：严禁简单的押韵堆砌。请精准捕捉该诗人的核心意象、修辞习惯和精神气质（例如李白的豪放与月亮、狄金森的短句与灵魂、波德莱尔的忧郁与感官）。
4.  **深度互评**：互评不应只是客套，要从美学观念、创作哲学的高度进行碰撞。

Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 📜 诗人雅集
**社长致辞**：[简要介绍本次雅集的主题与受邀诗人]

**第一篇章：诗意重构**
1. 🎭 **[诗人A]** ([流派/时期])
   *   **《[新拟诗名]》**
   *   [原创诗歌内容]
   *   **创作心路**：[诗人自述如何将笔记的具象内容转化为诗意的抽象表达]

2. 🎭 **[诗人B]** ([流派/时期])
   *   **《[新拟诗名]》**
   *   [原创诗歌内容]
   *   **创作心路**：...

3. 🎭 **[诗人C]** ([流派/时期])
   *   ...

**第二篇章：煮酒论诗 (互评)**
*   **[诗人A] 评 [诗人B]**：...
*   **[诗人B] 评 [诗人C]**：...
*   **[诗人C] 评 [诗人A]**：...

**社长结语**：
**灵感回响**：[诗意视角带来的独特感悟]`;
    }

    private getMindmapOutlinePrompt(): string {
        return `你是一个逻辑架构师。请将笔记内容转化为逻辑严密的思维导图大纲（Markdown 列表）。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 🗺️ 思维导图大纲
- 核心主题
    - 子分支...`;
    }

    private getKnowledgeLinkPrompt(): string {
        return `你是一个跨学科联想专家。请指出笔记内容可能与哪些其它领域的概念相关联。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 🔗 知识连接
**关联领域**：...
**启发联想**：...`;
    }

    private getConceptClarificationPrompt(): string {
        return `你是一个知识导师。请从笔记中提取核心概念，进行深度解析。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 📖 概念释义
**核心概念**：...
**深度解析**：...`;
    }

    private getBookRecommendationPrompt(): string {
        return `你是一个博学的阅读顾问，致力于打破信息茧房。请根据用户的笔记内容，推荐 6 本书籍。
**策略**：
1.  前 3 本：**深度相关**，深化或扩展笔记中的观点（侧重思想深度和经典性）。
2.  后 3 本：**惊喜跨界 (Serendipity)**，推荐 3 本看似与主题完全无关（如不同学科、不同领域、反直觉），但在底层逻辑或隐喻上能带来奇妙启发的书。

Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 📚 书单推荐
**一、深度相关**
1. **《[书名]》** [作者]
   *   **推荐理由**：...
   *   **核心洞察**：...
2. ...
3. ...

**二、惊喜跨界**
4. **《[书名]》** [作者] (💥跨界)
   *   **推荐理由**：[这本书虽然属于[领域]，但它关于...的思考能给当下的主题带来全新的...视角]
   *   **核心洞察**：...
5. ...
6. ...`;
    }

    private getPoetryRecommendationPrompt(): string {
        return `你是一个博古通今的世界文学鉴赏家。请根据用户的笔记意境，寻找 6 首**现存的经典诗歌**。
**⚠️ 关键要求 (Critical Instructions)：**
1.  **放眼全球**：**严禁只推荐中国古诗**。必须包含**外国诗歌**（欧美、拉美、日本、中东等）和**现代诗歌**。请致力于呈现多元文化的诗意共鸣。
2.  **拒绝陈词滥调**：**严禁**推荐教科书级别的大众名篇（如《静夜思》、《再别康桥》、《未选择的路》等）。请挖掘那些**文学性极高但相对冷门**，或大众熟知作者的**非代表作**。
3.  **古今交融**：跨越时间维度，从古希腊到当代先锋诗歌皆可取材。

**策略**：
1.  前 3 首：**同频共鸣**，风格与笔记的情感基调相符。
2.  后 3 首：**反差冲击**，选择 3 首风格、时代或情感基调截然相反的诗（例如：若笔记忧郁，则推豪放；若笔记理性，则推狂野），用对立面来激活感受。

Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 📜 诗歌共鸣
**一、同频共鸣**
1. **《[诗名]》** [作者] ([国籍/时期])
   *   **诗句引用**："[名句]"
   *   **共鸣赏析**：[这首诗如何呼应了笔记中的心境或哲理]
2. ...
3. ...

**二、反差冲击**
4. **《[诗名]》** [作者] ([国籍/时期]) (⚡️反差)
   *   **诗句引用**："[名句]"
   *   **冲击赏析**：[这首诗以完全不同的...风格，打破了...的沉闷/惯性，带来了...]
5. ...
6. ...`;
    }

    private getFigureRecommendationPrompt(): string {
        return `你是一个传记作家。请根据用户的笔记内容，推荐 6 位人物。
**策略**：
1.  前 3 位：**思想契合**，历史或现代领域内的高度相关人物。
2.  后 3 位：**跨界连接**，推荐 3 位完全不同领域（如艺术 vs 科学，古代 vs 现代）的人物，但其思维模式或人生选择有惊人的相似或互补之处。

Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 🤝 人物连接
**一、思想契合**
1. **[人物姓名]** ([身份/时期])
   *   **连接点**：...
   *   **启发**：...
2. ...
3. ...

**二、跨界连接**
4. **[人物姓名]** ([身份/时期]) (🔀跨界)
   *   **连接点**：[尽管 Ta 是[领域]的大师，但 Ta 关于...的做法与你现在的...有异曲同工之妙]
   *   **启发**：...
5. ...
6. ...`;
    }

    private getMediaRecommendationPrompt(): string {
        return `你是一个文化策展人。请根据用户的笔记内容，推荐 6 部电影、纪录片或播客。
**策略**：
1.  前 3 部：**主题印证**，从侧面深化笔记内容。
2.  后 3 部：**脑洞大开**，推荐 3 部风格迥异、题材跳跃甚至怪诞的作品，旨在提供完全不同的思考维度或审美体验。

Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 🎬 影音推荐
**一、主题印证**
1. **[作品名称]** ([类型])
   *   **推荐理由**：...
   *   **亮点**：...
2. ...
3. ...

**二、脑洞大开**
4. **[作品名称]** ([类型]) (🛸脑洞)
   *   **推荐理由**：[这部作品看似无关，但它以...的方式，挑战了你对于...的既定认知]
   *   **亮点**：...
5. ...
6. ...`;
    }

    private getDailyReviewPrompt(): string {
        return `你是一个复盘引导教练。请根据用户今日的笔记内容进行日评。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### ☀️ 日评
**今日成就**：[总结今日值得肯定的点]
**关键收获**：[学到了什么新东西/什么深刻洞察]
**待改进点**：[哪些地方可以做得更好]
**明日重点**：[基于今日情况建议的明日核心任务]`;
    }

    private getWeeklyReviewPrompt(): string {
        return `你是一个个人增长顾问。请对用户本周的笔记内容进行周度深度复盘。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 📅 周评
**本周趋势**：[识别本周的核心关注点和趋势]
**高光时刻**：[本周最具价值的时刻或产出]
**阻碍与挑战**：[遇到的主要困难及原因分析]
**下周规划建议**：[基于本周复盘的下周策略性建议]`;
    }

    private getProjectAARPrompt(): string {
        return `你是一个项目管理专家。请使用 AAR (After Action Review) 方法对用户笔记中提到的项目/事件进行复盘。
Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）
### 🎯 项目复盘 (AAR)
1. **预期目标**：[原本想要达成什么]
2. **实际结果**：[实际上发生了什么]
3. **差异分析**：[为什么会有差距？哪些做得好，哪些不好]
4. **经验总结**：[我们可以从中学到什么？下次如何改进]`;
    }

    private getMetadataExtractionPrompt(): string {
        return `Analyze the provided text and extract structured metadata.
Output ONLY a valid JSON object matching this schema:
{
    "title": "A concise title for the note",
    "tags": ["tag1", "tag2"],
    "summary": "A one-sentence summary",
    "actionItems": ["task 1", "task 2"],
    "mood": "Optional mood/energy level",
    "people": ["Name 1", "Name 2"],
    "date": "YYYY-MM-DD"
}
If a field is not applicable, omit it. Do not include any other text, explanations, or markdown code blocks.`;
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
        await this.recordActionUsage(action.id);

        switch (source.type) {
            case 'date-range':
                new TimeRangeModal(this.app, (start, end) => {
                    this.executeDateRangeAction(action, start, end);
                }).open();
                break;
            case 'tag':
                new TagSelectionModal(this.app, (tag) => {
                    this.executeTagAction(action, tag);
                }).open();
                break;
            case 'current-folder':
                this.executeFolderAction(action);
                break;
            case 'selection':
                this.executeSelectionAction(action);
                break;
            case 'current-note':
            default:
                this.executeCurrentNoteAction(action);
                break;
        }
    }

    private executeCurrentNoteAction(action: AIAction) {
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

    private async executeSelectionAction(action: AIAction) {
        let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        
        // If focus is in sidebar, try to find the view for the active file
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
            new Notice('No active Markdown view found.');
            return;
        }

        const editor = activeView.editor;
        const selection = editor.getSelection();

        if (!selection.trim()) {
            new Notice('No text selected.');
            return;
        }

        // Treat selection like a current note action but with selected text
        this.runLLM(action, selection, activeView.file, [], undefined, undefined, "Selected Text");
    }

    private async executeFolderAction(action: AIAction) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file to determine folder.');
            return;
        }

        const parent = activeFile.parent;
        if (!parent) {
             new Notice('Cannot determine parent folder.');
             return;
        }

        const files = this.fetchFilesByFolder(parent);
        if (files.length === 0) {
            new Notice('No markdown files found in current folder.');
            return;
        }

        new Notice(`Processing ${files.length} notes in folder ${parent.name}...`);
        
        const combinedContent = await this.combineFilesContent(files, `Folder: ${parent.path}`);
        this.runLLM(action, combinedContent, null, files, undefined, undefined, `Folder: ${parent.name}`);
    }

    private async executeTagAction(action: AIAction, tag: string) {
        const files = this.fetchFilesByTag(tag);
         if (files.length === 0) {
            new Notice(`No notes found with tag ${tag}.`);
            return;
        }

        new Notice(`Processing ${files.length} notes with tag ${tag}...`);

        const combinedContent = await this.combineFilesContent(files, `Tag: ${tag}`);
        this.runLLM(action, combinedContent, null, files, undefined, undefined, `Tag: ${tag}`);
    }

    private fetchFilesByFolder(folder: TFolder): TFile[] {
        const files: TFile[] = [];
        for (const child of folder.children) {
            if (child instanceof TFile && child.extension === 'md') {
                files.push(child);
            }
        }
        return files;
    }

    private fetchFilesByTag(tag: string): TFile[] {
        const files = this.app.vault.getMarkdownFiles();
        return files.filter(file => {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) return false;
            
            // Check frontmatter tags
            const frontmatterTags = cache.frontmatter?.tags;
            if (frontmatterTags) {
                if (Array.isArray(frontmatterTags)) {
                    if (frontmatterTags.includes(tag) || frontmatterTags.includes(tag.replace('#', ''))) return true;
                } else if (typeof frontmatterTags === 'string') {
                    if (frontmatterTags === tag || frontmatterTags === tag.replace('#', '')) return true;
                }
            }

            // Check inline tags
            if (cache.tags) {
                if (cache.tags.some(t => t.tag === tag)) return true;
            }

            return false;
        });
    }

    private async combineFilesContent(files: TFile[], headerInfo: string): Promise<string> {
        let combinedContent = `Context: ${headerInfo}\n\n`;
        for (const file of files) {
            const content = await this.app.vault.read(file);
            combinedContent += `\n\n--- Note: [[${file.basename}]] ---\n${content}`;
        }
        combinedContent += `\n\nIMPORTANT: You must start your response with "Topic: 3-5个字的简短主题（纯文本，不要加括号或任何格式）" on the very first line.`;
        return combinedContent;
    }

    private async executeDateRangeAction(action: AIAction, start: moment.Moment, end: moment.Moment) {
        const files = this.fetchFilesByDateRange(start, end);
        if (files.length === 0) {
            new Notice('No notes found in the selected date range.');
            return;
        }

        new Notice(`Processing ${files.length} notes...`);

        const combinedContent = await this.combineFilesContent(files, `Analysis Period: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);

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

    private async runLLM(action: AIAction, content: string, sourceFile: TFile | null, sourceFiles: TFile[] = [], start?: moment.Moment, end?: moment.Moment, contextInfo?: string) {
        new Notice(`Running AI Action: ${action.name}...`);

        try {
            const result = await this.llmManager.complete([
                { role: 'system', content: action.systemPrompt },
                { role: 'user', content: content }
            ]);

            await this.handleOutput(action, result, sourceFile, sourceFiles, start, end, contextInfo);
            new Notice('AI Action completed!');
        } catch (error) {
            console.error('AI Action failed:', error);
            const message = error instanceof Error ? error.message : String(error);
            new Notice(`AI Action failed: ${message}`);
        }
    }

    private async handleOutput(action: AIAction, text: string, sourceFile: TFile | null, sourceFiles: TFile[] = [], start?: moment.Moment, end?: moment.Moment, contextInfo?: string) {
        if (action.outputMode === 'frontmatter') {
            await this.handleFrontmatterOutput(text, sourceFile);
            return;
        }

        if (action.outputMode === 'new-note') {
            await this.createNewNote(action, text, sourceFile, sourceFiles, start, end, contextInfo);
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

    private async handleFrontmatterOutput(text: string, sourceFile: TFile | null) {
        if (!sourceFile) {
            new Notice('No source file to update frontmatter.');
            return;
        }

        const data = safeParseJson<ExtractedMetadata>(text);
        if (!data) {
            new Notice('Failed to parse metadata from AI response.');
            return;
        }

        try {
            await this.app.fileManager.processFrontMatter(sourceFile, (fm) => {
                if (data.title) fm['title'] = data.title;
                if (data.summary) fm['summary'] = data.summary;
                if (data.mood) fm['mood'] = data.mood;
                if (data.date) fm['date'] = data.date;

                if (data.tags && data.tags.length > 0) {
                    const existingTags = new Set<string>();
                    if (Array.isArray(fm['tags'])) {
                        fm['tags'].forEach((t: string) => existingTags.add(t));
                    } else if (typeof fm['tags'] === 'string') {
                        fm['tags'].split(',').forEach((t: string) => existingTags.add(t.trim()));
                    }
                    data.tags.forEach(t => existingTags.add(t));
                    fm['tags'] = Array.from(existingTags);
                }

                if (data.people && data.people.length > 0) {
                    const existingPeople = new Set<string>(fm['people'] || []);
                    data.people.forEach(p => existingPeople.add(p));
                    fm['people'] = Array.from(existingPeople);
                }

                if (data.actionItems && data.actionItems.length > 0) {
                    const existingActions = new Set<string>(fm['actionItems'] || []);
                    data.actionItems.forEach(a => existingActions.add(a));
                    fm['actionItems'] = Array.from(existingActions);
                }
            });
            new Notice('Frontmatter updated successfully!');
        } catch (error) {
            console.error('Failed to update frontmatter:', error);
            new Notice('Failed to update frontmatter.');
        }
    }

    private async createNewNote(action: AIAction, content: string, sourceFile: TFile | null, sourceFiles: TFile[] = [], start?: moment.Moment, end?: moment.Moment, contextInfo?: string) {
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
                // Remove potential brackets or quotes added by LLM
                topic = topic.replace(/^[\[【"']+|[\]】"']+$/g, '').trim();
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
        } else if (contextInfo) {
             // Sanitize context info for filename
             const sanitizedContext = contextInfo.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-').substring(0, 20);
             filenameBase += `-${sanitizedContext}`;
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
            if (contextInfo === "Selected Text") {
                finalContent += `> [!info] Scope: Selected Text\n\n`;
            }
        } else if (sourceFiles.length > 0) {
            if (start && end) {
                finalContent += `> [!info] Analysis of ${sourceFiles.length} notes from ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\n\n`;
            } else if (contextInfo) {
                finalContent += `> [!info] Analysis of ${sourceFiles.length} notes. Source: ${contextInfo}\n\n`;
            }
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
