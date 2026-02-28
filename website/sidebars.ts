import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: '简介',
    },
    {
      type: 'doc',
      id: 'installation',
      label: '安装与快速入门',
    },
    {
      type: 'category',
      label: '功能介绍',
      items: [
        'features/transcription',
        'features/ai-polish',
        'features/thinking-actions',
        'features/batch',
      ],
    },
    {
      type: 'category',
      label: 'Provider 配置',
      items: [
        'providers/overview',
        'providers/zhipu',
        'providers/volcengine',
        'providers/llm',
      ],
    },
    {
      type: 'doc',
      id: 'changelog',
      label: '更新日志',
    },
  ],
};

export default sidebars;
