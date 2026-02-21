// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProviderConfig from '../options/components/ProviderConfig';
import { Settings } from '../options/App';

describe('ProviderConfig', () => {
    afterEach(cleanup);

    const mockSettings: Settings = {
        topics: [
            { id: 'default', name: 'Default', prompt: 'test' }
        ],
        activeTopicId: 'default',
        provider: 'gemini',
        apiKeys: { gemini: 'test-key', openai: '', anthropic: '', custom: '' },
        customApiUrl: '',
        customModelName: '',
        maxTweets: 50,
        language: 'en',
        aiModelReady: false
    };

    it('should parse maxTweets as 0 when input is cleared completely', async () => {
        const updateSettingsMock = vi.fn();
        render(<ProviderConfig settings={{ ...mockSettings, provider: 'custom' }} updateSettings={updateSettingsMock} />);

        // Open Advanced Settings
        const advancedButton = screen.getByText('Advanced Provider Settings');
        fireEvent.click(advancedButton);

        const input = screen.getByLabelText('Max Tweets to Extract') as HTMLInputElement;
        expect(input.value).toBe('50');

        // Highlight all and backspace
        await userEvent.clear(input);

        // It should call updateSettings with 0 instead of NaN or throwing
        expect(updateSettingsMock).toHaveBeenLastCalledWith({ maxTweets: 0 });
    });

    it('should update maxTweets correctly when typing numbers', async () => {
        const updateSettingsMock = vi.fn();
        render(<ProviderConfig settings={{ ...mockSettings, provider: 'custom' }} updateSettings={updateSettingsMock} />);

        // Open Advanced Settings
        fireEvent.click(screen.getByText('Advanced Provider Settings'));

        const input = screen.getByLabelText('Max Tweets to Extract');
        fireEvent.change(input, { target: { value: '100' } });

        expect(updateSettingsMock).toHaveBeenLastCalledWith({ maxTweets: 100 });
    });
});
