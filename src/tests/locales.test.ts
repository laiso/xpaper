import { describe, it, expect } from 'vitest';
import { getLocale, locales } from '../lib/locales';

describe('locales', () => {
    it('should return English locale for "en"', () => {
        const locale = getLocale('en');
        expect(locale.defaultUserPrompt).toContain('Pick several interesting topics');
    });

    it('should return Japanese locale for "ja"', () => {
        const locale = getLocale('ja');
        expect(locale.defaultUserPrompt).toContain('提供されたポストからいくつか興味深いトピックを選び');

        // Ensure it is actually different from English
        expect(locale.defaultUserPrompt).not.toEqual(locales.en.defaultUserPrompt);
    });

    it('should fallback to English for unknown locales', () => {
        // @ts-ignore - purposefully passing invalid language
        const locale = getLocale('fr');
        expect(locale).toEqual(locales.en);
    });
});
