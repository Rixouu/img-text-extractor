declare module 'tesseract.js' {
    interface LoggerMessage {
        status: string;
        progress: number;
    }

    export interface Worker {
        loadLanguage(lang: string): Promise<void>;
        initialize(lang: string): Promise<void>;
        detect(image: File | string | Uint8Array | ImageData): Promise<{ data: { script: string } }>;
        recognize(image: File | string | Uint8Array | ImageData): Promise<{ data: { text: string } }>;
        terminate(): Promise<void>;
    }

    export interface CreateWorkerOptions {
        logger?: (m: LoggerMessage) => void;
    }

    export function createWorker(options?: CreateWorkerOptions): Promise<Worker>;
}