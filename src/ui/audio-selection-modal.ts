import { App, FuzzySuggestModal, TFile } from 'obsidian';

export class AudioSelectionModal extends FuzzySuggestModal<TFile> {
    private onSelect: (file: TFile) => void;
    private files: TFile[];

    constructor(app: App, files: TFile[], onSelect: (file: TFile) => void) {
        super(app);
        this.files = files;
        this.onSelect = onSelect;
        this.setPlaceholder("Select an audio file to transcribe");
    }

    getItems(): TFile[] {
        return this.files;
    }

    getItemText(file: TFile): string {
        return file.path;
    }

    onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent): void {
        this.onSelect(file);
    }
}
