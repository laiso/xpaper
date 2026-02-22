import { describe, it, expect } from 'vitest';
import { isChromeBuiltinAiAvailable } from '../lib/ai-readiness';

describe('isChromeBuiltinAiAvailable', () => {
    it('returns false when window has no ai capabilities', () => {
        expect(isChromeBuiltinAiAvailable({})).toBe(false);
    });

    it('returns true when window.ai.languageModel is available', () => {
        const mockWindow = {
            ai: {
                languageModel: {}
            }
        };
        expect(isChromeBuiltinAiAvailable(mockWindow)).toBe(true);
    });

    it('returns true when window.ai.create is available (older API style)', () => {
        const mockWindow = {
            ai: {
                create: () => { }
            }
        };
        expect(isChromeBuiltinAiAvailable(mockWindow)).toBe(true);
    });

    it('returns true when window.LanguageModel.create is available (alternate API style)', () => {
        const mockWindow = {
            LanguageModel: {
                create: () => { }
            }
        };
        expect(isChromeBuiltinAiAvailable(mockWindow)).toBe(true);
    });

    it('returns false when window.ai exists but has no supported methods', () => {
        const mockWindow = {
            ai: {
                // Some unsupported property
                foo: 'bar'
            }
        };
        expect(isChromeBuiltinAiAvailable(mockWindow)).toBe(false);
    });
});
