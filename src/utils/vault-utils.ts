import { App, TFile, iterateCacheRefs } from 'obsidian';

export class VaultUtils {
    static getReferencedAudioFiles(app: App, file: TFile): TFile[] {
        const cache = app.metadataCache.getFileCache(file);
        if (!cache) return [];

        const audioFiles: TFile[] = [];
        const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'webm']; // Extended list for better compatibility

        const processRef = (ref: { link: string }) => {
            const linkpath = ref.link.split('#')[0]; // Remove headers or blocks
            const dest = app.metadataCache.getFirstLinkpathDest(linkpath, file.path);
            if (dest && audioExtensions.includes(dest.extension.toLowerCase())) {
                if (!audioFiles.includes(dest)) {
                    audioFiles.push(dest);
                }
            }
        };

        if (cache.links) {
            cache.links.forEach(processRef);
        }
        if (cache.embeds) {
            cache.embeds.forEach(processRef);
        }

        return audioFiles;
    }
}
