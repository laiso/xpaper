import { TweetData, parseTweetsFromNode } from './twitter-parser';
export { parseTweetsFromNode };

export type ScrollAction = () => void | Promise<void>;
export type ParseAction = () => TweetData[];
export type SleepAction = (ms: number) => Promise<void>;

export async function extractTweetsWithScrolling(
    maxTweets: number = 30,
    maxScrolls: number = 10,
    signal?: AbortSignal,
    dependencies: {
        parseFn: ParseAction,
        scrollFn: ScrollAction,
        sleepFn: SleepAction
    } = {
            parseFn: () => parseTweetsFromNode(document),
            scrollFn: () => window.scrollBy(0, window.innerHeight * 0.8),
            sleepFn: (ms) => new Promise(r => setTimeout(r, ms))
        }
): Promise<TweetData[]> {
    const { parseFn, scrollFn, sleepFn } = dependencies;
    let collectedTweets: Map<string, TweetData> = new Map();
    let scrollCount = 0;
    let noNewTweetsCount = 0;

    const HARD_LIMIT = 500;
    const SAFETY_BUFFER_SIZE = Math.min(HARD_LIMIT, maxTweets * 2 + 50); // allow slight buffer over requested max

    const parseAndAdd = () => {
        const foundTweets = parseFn();
        for (const t of foundTweets) {
            const id = `${t.handle}_${t.text.substring(0, 50)}`;
            if (!collectedTweets.has(id)) {

                // If map gets too big, evict the earliest added entry to prevent massive memory scaling
                if (collectedTweets.size >= SAFETY_BUFFER_SIZE) {
                    const firstKey = collectedTweets.keys().next().value;
                    if (firstKey) collectedTweets.delete(firstKey);
                }

                collectedTweets.set(id, t);
            }
        }
    };

    // Initial parse before scrolling
    parseAndAdd();

    while (collectedTweets.size < maxTweets && scrollCount < maxScrolls) {
        if (signal?.aborted) break;

        const previousSize = collectedTweets.size;

        await scrollFn();
        scrollCount++;
        await sleepFn(800);

        if (signal?.aborted) break;
        parseAndAdd();

        if (collectedTweets.size >= maxTweets) {
            break;
        }

        if (collectedTweets.size === previousSize) {
            noNewTweetsCount++;
            if (noNewTweetsCount >= 5) {
                // Wait longer and check one last time
                await sleepFn(2000);
                parseAndAdd();
                if (collectedTweets.size === previousSize || signal?.aborted) {
                    break;
                }
            }
        } else {
            noNewTweetsCount = 0;
        }
    }

    return Array.from(collectedTweets.values()).slice(0, maxTweets);
}
