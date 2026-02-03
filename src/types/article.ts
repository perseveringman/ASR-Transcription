export interface ArticleContent {
    url: string;
    title: string;
    content: string;
    author?: string;
    publishDate?: string;
    siteName?: string;
}

export interface ArticleAnalysis {
    summary: string;
    keyPoints: string[];
    tags: string[];
}

export interface ArticleFetcher {
    readonly name: string;
    fetch(url: string): Promise<ArticleContent>;
}

export enum ArticleFetcherType {
    FETCH = 'fetch',
    // Future: JINA = 'jina', READABILITY = 'readability'
}
