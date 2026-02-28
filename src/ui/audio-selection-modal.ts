import { App, FuzzySuggestModal, TFile } from 'obsidian';

export class AudioSelectionModal extends FuzzySuggestModal<TFile> {
    private onSelect: (file: TFile) => void;
    private files: TFile[];

    constructor(app: App, files: TFile[], onSelect: (file: TFile) => void) {
        super(app);
        this.files = files;
        this.onSelect = onSelect;
        this.setPlaceholder('选择要转写的音频文件');
    }

    getItems(): TFile[] {
        return this.files;
    }

    getItemText(file: TFile): string {
        return file.path;
    }

    onChooseItem(file: TFile): void {
        this.onSelect(file);
    }
}
