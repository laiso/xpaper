interface AILanguageModel {
    create(options?: {
        expectedInputLanguage?: string;
        expectedOutputLanguage?: string;
        systemPrompt?: string;
        [key: string]: any;
    }): Promise<AILanguageModelSession>;
    availability(): Promise<'readily' | 'after-download' | 'downloadable' | 'downloading' | 'available' | 'no' | 'unavailable'>;
    capabilities?: () => Promise<AILanguageModelCapabilities>; // Legacy
}

interface AILanguageModelSession {
    prompt(text: string): Promise<string>;
    promptStreaming(text: string): ReadableStream;
    countPromptTokens(text: string): Promise<number>;
    maxTokens: number;
    tokensSoFar: number;
    tokensLeft: number;
    topK: number;
    temperature: number;
    destroy(): void;
    clone(): Promise<AILanguageModelSession>;
}

// Add global Window augmentation
export { };

declare global {
    interface Window {
        ai: {
            languageModel?: AILanguageModel;
        };
    }
}
