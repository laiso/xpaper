import { processWithCloudLLM, ProviderType } from '../lib/llm-providers';
import { decryptText } from '../lib/crypto';

console.log('Xpaper background script loaded');

chrome.runtime.onInstalled.addListener((details) => {
    console.log('Xpaper extension installed:', details.reason);
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
});

// Broadcast TOGGLE_OVERLAY to the active tab when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    try {
        await chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_OVERLAY' });
    } catch (e) {
        // If content script isn't injected yet (e.g. reload), inject it or notify
        console.warn('Could not send toggle message', e);
    }
});

// Message router for bypassing X.com CSP
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Security 1: Validate message origin to ensure it came from our own extension ID
    if (sender.id !== chrome.runtime.id) {
        console.warn('Blocked message from untrusted extension ID:', sender);
        return false;
    }

    // Security 2: For LLM API calls, strictly enforce that the request came from an X.com tab
    if (request.action === 'CALL_LLM_API') {
        const url = sender.url || (sender.tab && sender.tab.url);
        if (!url || !url.startsWith('https://x.com/')) {
            console.warn('Blocked LLM API call from untrusted origin/URL:', url);
            sendResponse({ success: false, error: 'Unauthorized request origin.' });
            return false;
        }
    }

    if (request.action === 'CALL_LLM_API') {
        const { sysPrompt, fullPrompt } = request.payload;

        chrome.storage.local.get('xpaper_settings', async (data) => {
            const settings: any = data.xpaper_settings || {};
            const provider = settings.provider || 'gemini';
            // Allow the user to override the model name for any provider
            const modelName = settings.customModelName;
            const customApiUrl = provider === 'custom' ? settings.customApiUrl : undefined;

            if (customApiUrl) {
                try {
                    const url = new URL(customApiUrl);
                    if (url.protocol !== 'https:') {
                        const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
                        if (!isLocalhost) {
                            sendResponse({ success: false, error: 'For security reasons, custom API URLs must use HTTPS (localhost exceptions apply).' });
                            return;
                        }
                    }
                } catch (e) {
                    sendResponse({ success: false, error: 'Invalid Custom API URL format.' });
                    return;
                }
            }

            const encryptedKey = (settings as any)?.apiKeys?.[provider];
            if (!encryptedKey) {
                sendResponse({ success: false, error: 'MISSING_KEY' });
                return;
            }

            try {
                const apiKey = await decryptText(encryptedKey);
                if (!apiKey) {
                    sendResponse({ success: false, error: 'Failed to decrypt API key. Please re-enter your key in Options.' });
                    return;
                }

                const result = await processWithCloudLLM(provider as ProviderType, apiKey, modelName, sysPrompt, fullPrompt, customApiUrl);
                sendResponse({ success: true, result });
            } catch (error: any) {
                console.error('LLM API Error:', error);
                sendResponse({ success: false, error: error.message || 'Unknown error occurred.' })
            }
        });

        return true; // Keep channel open for async response
    }

    if (request.action === 'OPEN_OPTIONS') {
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
    }
    return false;
});
