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

export const moment = () => ({
    format: (fmt: string) => "2024-01-24"
});
