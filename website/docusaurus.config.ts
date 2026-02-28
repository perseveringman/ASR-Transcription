import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Aura',
  tagline: 'Obsidian AI 认知引擎 — 让每一个想法都能生长',
  favicon: 'img/favicon.ico',

  url: 'https://perseveringman.github.io',
  baseUrl: '/Aura/',

  organizationName: 'perseveringman',
  projectName: 'Aura',
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
      title: 'Aura',
      logo: {
        alt: 'Aura Logo',
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
          href: 'https://github.com/perseveringman/Aura',
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
            {label: 'GitHub', href: 'https://github.com/perseveringman/Aura'},
            {label: '更新日志', to: '/docs/changelog'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Aura. Built with Docusaurus.`,
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
