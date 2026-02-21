import { describe, it, expect } from 'vitest';
import { buildPrompt, buildGrokPrompt } from '../lib/prompt-builder';
import { TweetData } from '../lib/twitter-parser';

describe('prompt-builder', () => {
    const mockTweets: TweetData[] = [
        { handle: '@user1', text: 'Hello world', time: '2023-01-01', url: 'https://x.com/user1/1' },
        { handle: '@user2', text: 'Testing', time: null, url: null }
    ];

    it('should build prompt correctly with EN instructions', () => {
        const { systemPrompt, userPrompt } = buildPrompt(mockTweets, 'Custom instructions', 'en');
        expect(systemPrompt).toContain('You are an expert news curator');
        expect(systemPrompt).toContain('English');
        expect(systemPrompt).toContain('<tweets>'); // Testing for CRITICAL RULE 3 presence

        expect(userPrompt).toContain('Custom instructions');
        expect(userPrompt).toContain('<tweets>');
        expect(userPrompt).toContain('User: @user1, Time: 2023-01-01, URL: https://x.com/user1/1');
        expect(userPrompt).toContain('User: @user2, Time: N/A');
        expect(userPrompt).toContain('</tweets>');
    });

    it('should build Grok prompt with character limits', () => {
        // Create a massive string to test truncation
        const longText = 'A'.repeat(4000);
        const tweets = [{ handle: '@user1', text: longText, time: null, url: null }];
        const prompt = buildGrokPrompt(tweets, 'Summarize', 'ja');

        expect(prompt.length).toBeLessThan(4000); // 3500 + prefix length
        expect(prompt).toContain('...(Omitted due to URL length limits)');
        expect(prompt).toContain('<tweets>');
        expect(prompt).toContain('</tweets>');
    });
});
