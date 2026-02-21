import { TweetData } from './twitter-parser';
import { getLocale, SupportedLanguage } from './locales';

export function buildPrompt(tweets: TweetData[], userInstructions: string, language: SupportedLanguage): { systemPrompt: string, userPrompt: string } {
    const formattedTweets = tweets.map((t, i) => `[${i + 1}] User: ${t.handle}, Time: ${t.time || 'N/A'}${t.url ? `, URL: ${t.url}` : ''}\n${t.text}`).join('\n\n');
    const userPrompt = `${userInstructions}\n\nContent to Distill:\n<tweets>\n${formattedTweets}\n</tweets>`;

    const locale = getLocale(language);
    const systemPrompt = locale.systemPrompt;

    return { systemPrompt, userPrompt };
}

export function buildGrokPrompt(tweets: TweetData[], userInstructions: string, language: 'ja' | 'en'): string {
    const MAX_CHARS = 3500;
    let formattedTweets = tweets.map((t, i) => `[${i + 1}] User: ${t.handle}\n${t.text}`).join('\n\n');

    if (formattedTweets.length > MAX_CHARS) {
        const locale = getLocale(language);
        formattedTweets = formattedTweets.substring(0, MAX_CHARS) + locale.grokTruncationWarning;
    }

    return `${userInstructions}\n\n<tweets>\n${formattedTweets}\n</tweets>`;
}
