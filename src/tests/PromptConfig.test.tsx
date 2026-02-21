// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PromptConfig from '../options/components/PromptConfig';
import { Settings } from '../options/App';
import { locales } from '../lib/locales';

describe('PromptConfig', () => {
    afterEach(cleanup);

    const mockSettings: Settings = {
        topics: [{ id: 'default', name: 'Default', prompt: locales.ja.defaultUserPrompt }],
        activeTopicId: 'default',
        provider: 'gemini',
        apiKeys: { gemini: '', openai: '', anthropic: '', custom: '' },
        customApiUrl: '',
        customModelName: '',
        maxTweets: 50,
        language: 'ja',
        aiModelReady: false
    };

    it('should overwrite prompt when changing language IF prompt is default', () => {
        const updateSettingsMock = vi.fn();
        render(<PromptConfig settings={mockSettings} updateSettings={updateSettingsMock} />);

        const langSelect = screen.getByLabelText('Output Language');
        fireEvent.change(langSelect, { target: { value: 'en' } });

        // Since the prompt matched the JA default, it should have been updated to EN default
        expect(updateSettingsMock).toHaveBeenCalledWith({
            language: 'en',
            topics: [{ id: 'default', name: 'Default', prompt: locales.en.defaultUserPrompt }]
        });
    });

    it('should NOT overwrite prompt when changing language IF prompt is custom', () => {
        const updateSettingsMock = vi.fn();
        const customSettings = { ...mockSettings, topics: [{ id: 'default', name: 'Default', prompt: 'My custom prompt' }] }
        render(<PromptConfig settings={customSettings} updateSettings={updateSettingsMock} />);

        const langSelect = screen.getByLabelText('Output Language');
        fireEvent.change(langSelect, { target: { value: 'en' } });

        // Since the prompt was custom, it should be preserved
        expect(updateSettingsMock).toHaveBeenCalledWith({
            language: 'en',
            topics: [{ id: 'default', name: 'Default', prompt: 'My custom prompt' }]
        });
    });
});
