export type SettingsTabId = 'quickstart' | 'asr' | 'llm' | 'ai-advanced' | 'general-advanced';

export interface SettingsTabItem {
    id: SettingsTabId;
    label: string;
    description: string;
}

export const SETTINGS_TABS: SettingsTabItem[] = [
    {
        id: 'quickstart',
        label: '快速开始',
        description: '引导与状态检查',
    },
    {
        id: 'asr',
        label: '转录 ASR',
        description: '语音识别服务配置',
    },
    {
        id: 'llm',
        label: '智能 LLM',
        description: '大模型服务配置',
    },
    {
        id: 'ai-advanced',
        label: 'AI 高级',
        description: '抛光风格与思维模型',
    },
    {
        id: 'general-advanced',
        label: '通用与高级',
        description: '文件夹、自动化与调试',
    },
];
