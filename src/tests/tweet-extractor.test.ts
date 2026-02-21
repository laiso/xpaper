// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { extractTweetsWithScrolling, parseTweetsFromNode } from '../lib/tweet-extractor';


describe('extractTweetsWithScrolling', () => {
    it('should extract exactly maxTweets when enough tweets are provided across scrolls', async () => {
        let callCount = 0;

        // Mock a virtual scroll behavior: 
        // 1st call: returns tweets 1-10
        // 2nd call: returns tweets 5-15 (simulating some overlap like a real DOM)
        // 3rd call: returns tweets 15-25
        const mockParse = vi.fn().mockImplementation(() => {
            callCount++;
            const start = (callCount - 1) * 10;
            return Array.from({ length: 15 }, (_, i) => ({
                handle: `@user${start + i}`,
                text: `Tweet text ${start + i}`,
                url: `https://x.com/status/${start + i}`,
                time: '2023-01-01'
            }));
        });

        const mockScroll = vi.fn();
        const mockSleep = vi.fn().mockResolvedValue(undefined); // don't actually sleep in tests

        const maxTweets = 20;
        const maxScrolls = 10;

        const result = await extractTweetsWithScrolling(
            maxTweets,
            maxScrolls,
            undefined, // no abort signal
            {
                parseFn: mockParse,
                scrollFn: mockScroll,
                sleepFn: mockSleep
            }
        );

        // It should have stopped exactly at 20 unique tweets
        expect(result.length).toBe(20);
        // First tweet is user0
        expect(result[0].handle).toBe('@user0');
        // 20th tweet is user19
        expect(result[19].handle).toBe('@user19');

        // Since it fetches 15 at first, then needs 1 more scroll to get the next batch to reach 20.
        // That means it parsed twice (initial + 1 scroll).
        expect(mockParse).toHaveBeenCalledTimes(2);
        expect(mockScroll).toHaveBeenCalledTimes(1);
    });

    it('should detect stuck virtual scroll and exit early without hitting maxScrolls', async () => {
        let callCount = 0;

        // Mock a stuck state where after the 2nd scroll no new tweets appear
        const mockParse = vi.fn().mockImplementation(() => {
            callCount++;
            // Always return the exact same 10 tweets
            return Array.from({ length: 10 }, (_, i) => ({
                handle: `@stuckUser${i}`,
                text: `Stuck Tweet ${i}`
            }));
        });

        const mockScroll = vi.fn();
        const mockSleep = vi.fn().mockResolvedValue(undefined);

        const result = await extractTweetsWithScrolling(
            50, // want 50
            100, // could scroll 100 times
            undefined,
            { parseFn: mockParse, scrollFn: mockScroll, sleepFn: mockSleep }
        );

        expect(result.length).toBe(10);

        // Let's trace the logic:
        // initial parse: size=10, noNewTweets=0
        // Loop 1 (scrollCount=0 -> 1): parse -> size=10 -> previousSize=10 -> noNewTweets=1
        // Loop 2 (scrollCount=1 -> 2): parse -> size=10 -> previousSize=10 -> noNewTweets=2
        // Loop 3 (scrollCount=2 -> 3): parse -> size=10 -> previousSize=10 -> noNewTweets=3
        // Loop 4 (scrollCount=3 -> 4): parse -> size=10 -> previousSize=10 -> noNewTweets=4
        // Loop 5 (scrollCount=4 -> 5): parse -> size=10 -> previousSize=10 -> noNewTweets=5 -> wait 2000ms, parse again -> still 10 -> BREAK

        // Total parses: initial(1) + 5 loops(5) + 1 extra retry = 7
        expect(mockParse).toHaveBeenCalledTimes(7);
        // Total scrolls: loop1..loop5 = 5
        expect(mockScroll).toHaveBeenCalledTimes(5);
    });
});

describe('sanitizeText', () => {
    it('should strip ASCII control characters from extracted text', () => {
        // Set up a fake DOM node with malicious control chars
        const mockDoc = document.createElement('div');
        document.body.appendChild(mockDoc);
        mockDoc.innerHTML = `
            <article data-testid="tweet">
                <div>
                    <a role="link" href="/maliciousUser"><span>@maliciousUser</span></a>
                </div>
                <div>
                    <a href="https://x.com/status/123"><time datetime="2023-01-01T00:00:00.000Z"></time></a>
                </div>
                <div data-testid="tweetText"></div>
            </article>
        `;
        // JSDOM innerText polyfill hack
        const tweetText = mockDoc.querySelector('[data-testid="tweetText"]') as HTMLElement;
        tweetText.innerText = "Hello\x00World\x1FThis\nIs\tFine";

        const tweets = parseTweetsFromNode(mockDoc);
        expect(tweets).toHaveLength(1);
        expect(tweets[0].handle).toBe('@maliciousUser');
        // \x00 and \x1F should be stripped, \n and \t should remain
        expect(tweets[0].text).toBe('HelloWorldThis\nIs\tFine');
    });
});
