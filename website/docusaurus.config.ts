import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'ASR Transcription',
  tagline: '让每一段声音，都成为可检索的知识',
  favicon: 'img/favicon.ico',

  url: 'https://perseveringman.github.io',
  baseUrl: '/ASR-Transcription/',

  organizationName: 'perseveringman',
  projectName: 'ASR-Transcription',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'ASR Transcription',
      logo: {
        alt: 'ASR Transcription Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '文档',
        },
        {
          to: '/docs/changelog',
          label: '更新日志',
          position: 'left',
        },
        {
          href: 'https://github.com/perseveringman/ASR-Transcription',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {label: '快速入门', to: '/docs/installation'},
            {label: '功能介绍', to: '/docs/features/transcription'},
            {label: 'Provider 配置', to: '/docs/providers/zhipu'},
          ],
        },
        {
          title: '更多',
          items: [
            {label: 'GitHub', href: 'https://github.com/perseveringman/ASR-Transcription'},
            {label: '更新日志', to: '/docs/changelog'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ASR Transcription. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['zh', 'en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],
};

export default config;
