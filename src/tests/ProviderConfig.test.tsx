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

    it('should render Provider select with optgroups and updated labels', () => {
        const updateSettingsMock = vi.fn();
        render(<ProviderConfig settings={mockSettings} updateSettings={updateSettingsMock} />);

        // Verify that option groups exist by their labels
        expect(screen.getByRole('group', { name: 'Web Redirect' })).toBeDefined();
        expect(screen.getByRole('group', { name: 'Cloud & Local APIs' })).toBeDefined();
        expect(screen.getByRole('group', { name: 'Experimental' })).toBeDefined();

        // Verify specific option text
        expect(screen.getByRole('option', { name: 'X Grok (Redirect)' })).toBeDefined();
        expect(screen.getByRole('option', { name: 'Chrome Built-in Model (Gemini Nano)' })).toBeDefined();
    });

    it('should not render READY/NOT READY badges and only display info text for Chrome Built-in Model', () => {
        const updateSettingsMock = vi.fn();
        // Test when aiModelReady is true
        const { unmount } = render(<ProviderConfig settings={{ ...mockSettings, provider: 'auto', aiModelReady: true }} updateSettings={updateSettingsMock} />);

        expect(screen.getByText('Local Nano model is available and ready for inference.')).toBeDefined();
        // The badge element containing 'READY' or 'INFO' was explicitly removed
        expect(screen.queryByText(/READY|INFO|NOT READY/)).toBeNull();

        unmount();

        // Test when aiModelReady is false
        render(<ProviderConfig settings={{ ...mockSettings, provider: 'auto', aiModelReady: false }} updateSettings={updateSettingsMock} />);
        expect(screen.getByText('Please ensure Chrome Built-in Model features are enabled in chrome://flags.')).toBeDefined();
        expect(screen.queryByText(/READY|INFO|NOT READY/)).toBeNull();
    });
});
