import { describe, it, expect } from 'vitest';
import { formatApiResponse } from '../lib/result-formatter';

describe('result-formatter', () => {
    it('should strip out leading AI thoughts and add fixed header', () => {
        const rawText = "Here are my core insights:\n\n# Today's Highlights\n\n## Topic 1\nContent 1";
        const result = formatApiResponse(rawText, 'en');

        expect(result).toBe("# Xpaper\n\n# Today's Highlights\n\n## Topic 1\nContent 1");
    });

    it('should format clean text correctly', () => {
        const rawText = "## Topic A\nContent A";
        const result = formatApiResponse(rawText, 'ja');

        expect(result).toBe("# Xpaper\n\n## Topic A\nContent A");
    });
});
