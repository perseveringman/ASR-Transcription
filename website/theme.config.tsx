import type { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 700 }}>Aura</span>,
  project: {
    link: 'https://github.com/perseveringman/Aura',
  },
  docsRepositoryBase: 'https://github.com/perseveringman/Aura',
  footer: {
    text: `Copyright © ${new Date().getFullYear()} Aura. Built with Nextra.`,
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Aura — Obsidian AI 认知引擎" />
    </>
  ),
  i18n: [],
  sidebar: {
    titleComponent({ title }) {
      return <>{title}</>;
    },
    defaultMenuCollapseLevel: 1,
  },
  navigation: true,
};

export default config;
