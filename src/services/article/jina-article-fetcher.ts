import { ArticleFetcher, ArticleContent } from '../../types/article';
import { requestUrl } from 'obsidian';

export class JinaArticleFetcher implements ArticleFetcher {
    readonly name = 'jina';
    
    constructor(private apiKey: string) {}

    async fetch(url: string): Promise<ArticleContent> {
        const jinaUrl = `https://r.jina.ai/${url}`;
        
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'X-Return-Format': 'markdown'
        };
        
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const response = await requestUrl({
            url: jinaUrl,
            method: 'GET',
            headers
        });

        const json = response.json;
        
        // Jina Reader returns { code, status, data: { url, title, content, ... } }
        const data = json.data || json;
        
        if (json.code !== 200 && json.status !== 200) {
            throw new Error(`Jina Reader error: ${json.message || 'Unknown error'}`);
        }
        
        return {
            url: data.url || url,
            title: data.title || 'Untitled',
            content: data.content || data.text || '',
            author: data.author,
            publishDate: data.publishedTime || data.published_time,
            siteName: data.siteName || data.site_name || this.extractHostname(url)
        };
    }

    private extractHostname(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return '';
        }
    }
}
