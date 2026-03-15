import { vi } from 'vitest';

// Mock chrome.i18n API
const messages: Record<string, string> = {
    extensionName: 'Xpaper',
    extensionDescription: 'Craft your personal newsletter with AI',
    askGrokTooltip: 'Ask Grok about this post',
    summarizeWithGrok: 'Summarize with Grok',
    publishXpaper: 'Publish Xpaper',
    extensionUpdatedError: 'Extension updated. Please reload the page (F5).',
    noTweetsFound: 'No tweets found on the current screen.',
    scrollingTimeline: 'Scrolling timeline...',
    generatingXpaper: 'Generating Xpaper...',
    apiKeyRequired: 'API Key Required',
    apiKeyRequiredDesc: 'You need to set up a Cloud LLM API Key (like Google Gemini) to start distilling.',
    openSettings: 'Open Settings',
    settingsTitle: 'Settings',
    closeTitle: 'Close',
    readyToPublish: 'Ready to Publish',
    readyToPublishDesc: 'Click the button below to curate your timeline into a personalized edition.',
    processedItems: 'Processed $COUNT$ items',
    copiedToClipboard: 'Copied to Clipboard!',
    copyResult: 'Copy Result',
    optionsTitle: 'Options',
    optionsSubtitle: 'Configure your personal Xpaper AI settings.',
    saved: 'Saved',
    providerSettingsHeading: '1. AI Provider Settings',
    providerSettingsDesc: 'Select your preferred AI Provider. The default is Google Gemini API.',
    activeAIProvider: 'Active AI Provider',
    cloudLocalAPIs: 'Cloud & Local APIs',
    experimental: 'Experimental',
    geminiOption: 'Google Gemini API (Gemini 3 Flash)',
    openaiOption: 'OpenAI API (GPT-5 mini)',
    anthropicOption: 'Anthropic API (Claude 4.5 Haiku)',
    customOption: 'Custom API (OpenRouter / Local)',
    chromeNanoOption: 'Chrome Built-in Model (Gemini Nano)',
    nanoReady: 'Local Nano model is available and ready for inference.',
    nanoNotReady: 'Please ensure Chrome Built-in Model features are enabled in chrome://flags.',
    grokRedirectTitle: 'Grok Redirect Mode:',
    grokRedirectDesc: 'Opens X\'s Grok AI in a new tab with your timeline content. Free to try (no API key required). Limited to ~15 posts due to URL length constraints.',
    geminiApiKey: 'Google Gemini API Key',
    requiredForGemini: 'Required for Google Gemini API.',
    openaiApiKey: 'OpenAI API Key',
    anthropicApiKey: 'Anthropic API Key',
    customApiUrl: 'Custom API Base URL',
    customApiUrlDesc: 'The full ChatCompletion Endpoint URL (e.g. OpenRouter, LM Studio).',
    accessRequired: 'Access Required:',
    localIPPermissionDesc: 'Local IP addresses require explicit permission to be accessed over HTTP.',
    grantBrowserPermission: 'Grant Browser Permission',
    localNetworkGranted: 'Local network permission granted.',
    customApiKey: 'Custom API Key',
    modelName: 'Model Name',
    modelNameDesc: 'The specific model to use for inference. You can overwrite this to use other versions (e.g. gpt-4o).',
    advancedProviderSettings: 'Advanced Provider Settings',
    maxTweetsExtract: 'Max Tweets to Extract',
    maxTweetsDesc: 'Reduce this number to speed up distillation testing, or increase it for deeper context.',
    useXGrokRedirect: 'Use X Grok (Redirect Mode)',
    grokRedirectNote: 'Opens X\'s Grok AI in a new tab with your timeline content. Free to try (no API key required).',
    grokRedirectLimitNote: 'Note: Limited to ~15 posts due to URL length constraints.',
    processingRulesHeading: '2. AI Processing Rules',
    outputLanguage: 'Output Language',
    systemPromptLabel: 'System Prompt for Xpaper',
    resetToDefault: 'Reset to Default',
    resetToDefaultTitle: 'Reset to recommended default prompt',
    promptPlaceholder: 'Instruct the AI how to format and filter the information...',
    promptDesc: 'Customize how the AI evaluates and reformats extracted text. E.g., "Summarize in 3 bullet points, output as JSON."',
    sourceTargetsHeading: '3. Source Targets',
    sourceTargetsDesc: 'Xpaper only processes content explicitly targeted for distillation to keep operations safe and intentional.',
    primaryTarget: 'Primary Target',
    xcomTwitter: 'X.com (Twitter)',
    activeTabClipping: 'Active Tab Clipping',
    enabled: 'Enabled',
    sourceTargetHelp: 'Navigate to an X.com page and use the extension popup to extract content safely without background scraping.',
    unauthorizedOrigin: 'Unauthorized request origin.',
    httpsRequired: 'For security reasons, custom API URLs must use HTTPS (localhost exceptions apply).',
    invalidApiUrl: 'Invalid Custom API URL format.',
    decryptFailed: 'Failed to decrypt API key. Please re-enter your key in Options.',
    unknownError: 'Unknown error occurred.',
    extensionUpdatedReload: 'Extension was updated. Please reload (F5) the X.com tab.',
    chromeAiNotAvailable: 'Chrome Built-in AI is not available or failed to generate text. Please ensure it is enabled in chrome://flags.',
    japanese: 'Japanese',
    english: 'English'
};

vi.stubGlobal('chrome', {
    i18n: {
        getMessage: (key: string, substitutions?: string | string[]) => {
            let message = messages[key] || key;
            if (substitutions) {
                const sub = Array.isArray(substitutions) ? substitutions[0] : substitutions;
                message = message.replace('$COUNT$', sub);
            }
            return message;
        },
        getUILanguage: () => 'en'
    },
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined)
        }
    },
    permissions: {
        contains: vi.fn().mockResolvedValue(false),
        request: vi.fn().mockResolvedValue(false)
    },
    runtime: {
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn()
        },
        sendMessage: vi.fn()
    }
});