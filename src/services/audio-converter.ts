export class AudioConverter {
    /**
     * Splits an audio Blob into multiple WAV Blobs of specified duration
     */
    static async splitAndConvert(audioBlob: Blob, chunkDurationSeconds: number = 30): Promise<Blob[]> {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        try {
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const totalDuration = audioBuffer.duration;
            const chunks: Blob[] = [];
            
            for (let start = 0; start < totalDuration; start += chunkDurationSeconds) {
                const end = Math.min(start + chunkDurationSeconds, totalDuration);
                const chunkBuffer = this.sliceAudioBuffer(audioContext, audioBuffer, start, end);
                const wavBuffer = this.encodeWAV(chunkBuffer);
                chunks.push(new Blob([wavBuffer], { type: 'audio/wav' }));
            }
            
            return chunks;
        } finally {
            await audioContext.close();
        }
    }

    private static sliceAudioBuffer(ctx: AudioContext, buffer: AudioBuffer, start: number, end: number): AudioBuffer {
        const sampleRate = buffer.sampleRate;
        const startOffset = Math.floor(start * sampleRate);
        const endOffset = Math.floor(end * sampleRate);
        const frameCount = endOffset - startOffset;
        
        const newBuffer = ctx.createBuffer(buffer.numberOfChannels, frameCount, sampleRate);
        
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            const channelData = buffer.getChannelData(i);
            const newChannelData = newBuffer.getChannelData(i);
            newChannelData.set(channelData.subarray(startOffset, endOffset));
        }
        
        return newBuffer;
    }

    /**
     * Converts a Blob or File to a WAV format Blob
     */
    static async convertToWav(audioBlob: Blob): Promise<Blob> {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        try {
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const wavBuffer = this.encodeWAV(audioBuffer);
            return new Blob([wavBuffer], { type: 'audio/wav' });
        } finally {
            await audioContext.close();
        }
    }

    private static encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        // We'll convert to mono to save space and match ASR requirements usually
        const data = this.interleaveChannels(audioBuffer);
        const bytesPerSample = bitDepth / 8;
        const blockAlign = bytesPerSample;
        
        const buffer = new ArrayBuffer(44 + data.length * bytesPerSample);
        const view = new DataView(buffer);
        
        /* RIFF identifier */
        this.writeString(view, 0, 'RIFF');
        /* file length */
        view.setUint32(4, 36 + data.length * bytesPerSample, true);
        /* RIFF type */
        this.writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        this.writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, format, true);
        /* channel count */
        view.setUint16(22, 1, true); // Mono
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * blockAlign, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, blockAlign, true);
        /* bits per sample */
        view.setUint16(34, bitDepth, true);
        /* data chunk identifier */
        this.writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, data.length * bytesPerSample, true);
        
        // Write PCM samples
        this.floatTo16BitPCM(view, 44, data);
        
        return buffer;
    }

    private static interleaveChannels(audioBuffer: AudioBuffer): Float32Array {
        const numberOfChannels = audioBuffer.numberOfChannels;
        if (numberOfChannels === 1) {
            return audioBuffer.getChannelData(0);
        }
        
        // Simple downmix to mono (average of all channels)
        const channels = [];
        for (let i = 0; i < numberOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }
        
        const length = audioBuffer.length;
        const result = new Float32Array(length);
        
        for (let i = 0; i < length; i++) {
            let sum = 0;
            for (let j = 0; j < numberOfChannels; j++) {
                sum += channels[j][i];
            }
            result[i] = sum / numberOfChannels;
        }
        
        return result;
    }

    private static writeString(view: DataView, offset: number, string: string): void {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    private static floatTo16BitPCM(view: DataView, offset: number, input: Float32Array): void {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }
}
