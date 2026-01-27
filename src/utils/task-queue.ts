
export type Task<T> = () => Promise<T>;

export interface TaskQueueOptions {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
}

export class TaskQueue {
    private queue: { task: Task<any>, resolve: (value: any) => void, reject: (reason?: any) => void }[] = [];
    private running = 0;
    private total = 0;
    private completed = 0;
    private concurrency: number;
    private onProgress?: (completed: number, total: number) => void;

    constructor(options: TaskQueueOptions = {}) {
        this.concurrency = options.concurrency || 20;
        this.onProgress = options.onProgress;
    }

    add<T>(task: Task<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.total++;
            this.next();
        });
    }

    private async next() {
        if (this.running >= this.concurrency || this.queue.length === 0) {
            return;
        }

        const { task, resolve, reject } = this.queue.shift()!;
        this.running++;

        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.running--;
            this.completed++;
            if (this.onProgress) {
                this.onProgress(this.completed, this.total);
            }
            this.next();
        }
    }

    get isIdle(): boolean {
        return this.running === 0 && this.queue.length === 0;
    }

    get progress(): { completed: number, total: number } {
        return { completed: this.completed, total: this.total };
    }
}
