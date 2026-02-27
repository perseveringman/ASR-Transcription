export class Notice {
    constructor(public message: string) {}
}

export class TFile {
    path: string;
    name: string;
    extension: string;
    basename: string;
    parent: any;
    stat: any;
}

export class Plugin {
    app: App;
    manifest: any;
    constructor(app: App, manifest: any) {
        this.app = app;
        this.manifest = manifest;
    }
}

export class App {
    vault: any;
    workspace: any;
    metadataCache: any;
}

function pad(value: number): string {
    return value.toString().padStart(2, '0');
}

function formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());

    switch (format) {
        case 'YYYYMMDD-HHmmss':
            return `${year}${month}${day}-${hour}${minute}${second}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'HH:mm:ss':
            return `${hour}:${minute}:${second}`;
        case 'YYYY-MM-DD HH:mm:ss':
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        default:
            return date.toISOString();
    }
}

export const moment = (input?: string | number | Date) => {
    const date = input !== undefined ? new Date(input) : new Date();
    return {
        format: (fmt: string) => formatDate(date, fmt)
    };
};
