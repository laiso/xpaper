export interface TweetData {
    handle: string;
    text: string;
    time: string | null;
    url: string | null;
}

function sanitizeText(text: string): string {
    if (!text) return '';
    // Strip malicious ASCII control characters, keeping newlines/tabs
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

export function extractTweetText(element: Element | null): string {
    if (!element) return '';
    return Array.from(element.querySelectorAll('[data-testid="tweetText"] *'))
        .filter(n => n.nodeType === Node.TEXT_NODE || n.tagName === 'IMG')
        .map(n => n.nodeType === Node.TEXT_NODE ? n.textContent : (n as HTMLImageElement).alt)
        .join('')
        .trim();
}

export function parseTweetsFromNode(rootNode: Element | Document): TweetData[] {
    const tweets: TweetData[] = [];
    // JSDOM or Browser DOM Document/Element
    const articles = rootNode.querySelectorAll('article[data-testid="tweet"]');

    articles.forEach(article => {
        // Find the handle (e.g., @username)
        const handleElements = article.querySelectorAll('a[role="link"] span');
        let handle = '';
        handleElements.forEach(span => {
            if (span.textContent?.trim().startsWith('@')) {
                handle = span.textContent.trim();
            }
        });

        // Find the timestamp/permalink
        const timeElement = article.querySelector('time');
        let time = timeElement?.getAttribute('datetime') || null;
        let url: string | null = null;

        // X (Twitter) puts the post URL on the anchor wrapping the time element
        if (timeElement) {
            const timeAnchor = timeElement.closest('a');
            if (timeAnchor && timeAnchor.href) {
                // Return standard absolute URL
                url = timeAnchor.href;
            }
        }

        // Find the main text
        const textElement = article.querySelector('[data-testid="tweetText"]');
        const rawText = textElement ? (textElement as HTMLElement).innerText : '';
        const text = sanitizeText(rawText);

        // Only include if there's actual text content
        if (text && handle) {
            tweets.push({
                handle,
                text,
                time,
                url
            });
        }
    });

    return tweets;
}
