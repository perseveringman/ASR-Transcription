import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/installation">
            快速开始 →
          </Link>
          <Link className="button button--outline button--secondary button--lg" to="/docs/">
            了解更多
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '声音变文字',
    description: (
      <>
        录制音频或转写已有文件，支持智谱 AI 和火山引擎豆包。长音频自动分片，最长支持 4 小时会议录音。
      </>
    ),
  },
  {
    title: '文字变知识',
    description: (
      <>
        AI 润色将口语稿变为书面文；20+ 种思维动作——第一性原理、六顶思考帽、每日复盘——让笔记产生深度洞见。
      </>
    ),
  },
  {
    title: '知识可生长',
    description: (
      <>
        批量处理整个文件夹或标签，自动生成带反向链接的洞见笔记，让你的知识库随时间持续积累。
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md padding-vert--lg">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout description="Obsidian AI 认知引擎：语音转写、AI 润色、思维动作，让每一个想法都能生长">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
