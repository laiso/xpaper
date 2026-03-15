/**
 * Internationalization utilities for Xpaper Chrome Extension
 * Wraps chrome.i18n.getMessage for React components
 */

/**
 * Get a localized message by key
 * @param key - The message key from messages.json
 * @param substitutions - Optional substitutions for placeholders
 */
export function t(key: string, substitutions?: string | string[]): string {
    return chrome.i18n.getMessage(key, substitutions) || key;
}

/**
 * Get a localized message with a single substitution
 * Useful for messages like "Processed {count} items"
 */
export function tWithCount(key: string, count: number): string {
    return chrome.i18n.getMessage(key, count.toString()) || key;
}

/**
 * Get the current UI language
 * Returns 'en', 'ja', etc.
 */
export function getUILanguage(): string {
    return chrome.i18n.getUILanguage().split('-')[0];
}

/**
 * Check if the current UI language is Japanese
 */
export function isJapaneseUI(): boolean {
    return getUILanguage() === 'ja';
}