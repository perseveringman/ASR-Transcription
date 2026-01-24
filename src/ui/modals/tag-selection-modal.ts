import { App, FuzzySuggestModal, Notice } from 'obsidian';

export class TagSelectionModal extends FuzzySuggestModal<string> {
    constructor(app: App, private onChoose: (tag: string) => void) {
        super(app);
        this.setPlaceholder('Select a tag...');
    }

    getItems(): string[] {
        // @ts-ignore
        const tagsObject = this.app.metadataCache.getTags();
        if (!tagsObject) return [];
        
        // Returns object: { "#tag": count, "#tag/sub": count }
        return Object.keys(tagsObject);
    }

    getItemText(tag: string): string {
        return tag;
    }

    onChooseItem(tag: string, evt: MouseEvent | KeyboardEvent) {
        this.onChoose(tag);
    }
}
