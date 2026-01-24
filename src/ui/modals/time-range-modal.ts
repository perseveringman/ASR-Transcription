import { App, Modal, Setting, TFile, moment } from 'obsidian';

export class TimeRangeModal extends Modal {
    private startDate: string = moment().subtract(7, 'days').format('YYYY-MM-DD');
    private endDate: string = moment().format('YYYY-MM-DD');
    private onSubmit: (start: moment.Moment, end: moment.Moment) => void;

    constructor(app: App, onSubmit: (start: moment.Moment, end: moment.Moment) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Select Time Range' });

        new Setting(contentEl)
            .setName('Presets')
            .setDesc('Quickly select a common range')
            .addDropdown(dropdown => dropdown
                .addOption('custom', 'Custom')
                .addOption('today', 'Today')
                .addOption('yesterday', 'Yesterday')
                .addOption('last7', 'Last 7 Days')
                .addOption('thisWeek', 'This Week (Mon-Sun)')
                .addOption('last30', 'Last 30 Days')
                .setValue('last7')
                .onChange((value) => {
                    const today = moment();
                    switch (value) {
                        case 'today':
                            this.startDate = today.format('YYYY-MM-DD');
                            this.endDate = today.format('YYYY-MM-DD');
                            break;
                        case 'yesterday':
                            const yest = today.clone().subtract(1, 'days');
                            this.startDate = yest.format('YYYY-MM-DD');
                            this.endDate = yest.format('YYYY-MM-DD');
                            break;
                        case 'last7':
                            this.startDate = today.clone().subtract(7, 'days').format('YYYY-MM-DD');
                            this.endDate = today.format('YYYY-MM-DD');
                            break;
                        case 'thisWeek':
                            this.startDate = today.clone().startOf('isoWeek').format('YYYY-MM-DD');
                            this.endDate = today.format('YYYY-MM-DD');
                            break;
                        case 'last30':
                            this.startDate = today.clone().subtract(30, 'days').format('YYYY-MM-DD');
                            this.endDate = today.format('YYYY-MM-DD');
                            break;
                    }
                    this.refreshInputs();
                }));

        this.renderInputs(contentEl);

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Confirm')
                .setCta()
                .onClick(() => {
                    this.close();
                    // End date should include the whole day, so set to end of day? 
                    // Usually filtering by file creation time which is timestamp. 
                    // So Start 00:00:00 to End 23:59:59.
                    // The caller handles logic, here we just return dates.
                    this.onSubmit(moment(this.startDate), moment(this.endDate));
                }));
    }

    private startInputSetting: Setting | null = null;
    private endInputSetting: Setting | null = null;

    private renderInputs(el: HTMLElement) {
        this.startInputSetting = new Setting(el)
            .setName('Start Date')
            .addText(text => text
                .inputEl.type = 'date');
        
        this.endInputSetting = new Setting(el)
            .setName('End Date')
            .addText(text => text
                .inputEl.type = 'date');
        
        this.refreshInputs();
    }

    private refreshInputs() {
        if (this.startInputSetting) {
             const input = this.startInputSetting.components[0] as any; // text component
             input.setValue(this.startDate);
             input.onChange(async (val: string) => { this.startDate = val; });
        }
        if (this.endInputSetting) {
             const input = this.endInputSetting.components[0] as any;
             input.setValue(this.endDate);
             input.onChange(async (val: string) => { this.endDate = val; });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
