import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { processWithCloudLLM } from '../lib/llm-providers';

describe('llm-providers', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeAll(() => {
        originalFetch = globalThis.fetch;
    });

    afterAll(() => {
        globalThis.fetch = originalFetch;
    });

    it('should include anthropic-dangerous-direct-browser-access header when calling Anthropic', async () => {
        const fetchMock = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ content: [{ text: "MOCK_ANTHROPIC_RESPONSE" }] })
            } as any)
        );
        globalThis.fetch = fetchMock;

        const result = await processWithCloudLLM(
            'anthropic',
            'test-api-key',
            'test-model',
            'system prompt',
            'user prompt'
        );

        expect(result).toBe("MOCK_ANTHROPIC_RESPONSE");

        // Verify fetch was called with the correct Anthropic CORS header
        expect(fetchMock).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'anthropic-dangerous-direct-browser-access': 'true',
                'x-api-key': 'test-api-key'
            })
        }));
    });
});
