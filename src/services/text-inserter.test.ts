import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { TextInserter } from './text-inserter';
import { DEFAULT_SETTINGS, InsertPosition } from '../types/config';

describe('TextInserter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 0, 1, 10, 11, 12));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('uses audio file creation date when creating a new transcription note', async () => {
        const app = {
            vault: {
                adapter: { exists: vi.fn().mockResolvedValue(false) },
                createFolder: vi.fn(),
                getAbstractFileByPath: vi.fn(),
                read: vi.fn(),
                create: vi.fn().mockResolvedValue({ path: 'Transcription-20250315-080910.md' })
            },
            workspace: {
                getActiveViewOfType: vi.fn().mockReturnValue(null),
                getActiveFile: vi.fn(),
                getLeaf: vi.fn().mockReturnValue({
                    openFile: vi.fn().mockResolvedValue(undefined)
                })
            }
        } as any;

        const settings = {
            ...DEFAULT_SETTINGS,
            insertPosition: InsertPosition.NEW_NOTE
        };
        const inserter = new TextInserter(app, settings);
        const audioFile = {
            path: 'Recordings/meeting.m4a',
            stat: { ctime: new Date(2025, 2, 15, 8, 9, 10).getTime() }
        } as TFile;

        await inserter.insert('hello world', audioFile);

        expect(app.vault.create).toHaveBeenCalledWith(
            'Transcription-20250315-080910.md',
            expect.any(String)
        );
    });
});
