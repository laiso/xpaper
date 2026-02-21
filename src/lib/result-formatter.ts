import { getLocale, SupportedLanguage } from './locales';

export function formatApiResponse(rawText: string, language: SupportedLanguage = 'en'): string {
    let cleanResult = rawText.replace(/^#*.*(?:核心的|洞察|実用的|情報|Core|insight|actionable).*\n?/gm, '').trim();
    const title = getLocale(language).outputTitle;
    return `${title}\n\n${cleanResult}`;
}
