import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

// Options Configs
import PromptConfig from './components/PromptConfig'
import ProviderConfig from './components/ProviderConfig'

import { encryptText, decryptText } from '../lib/crypto'
import { getLocale } from '../lib/locales'

import './index.css'

export type Settings = {
    aiModelReady: boolean
    language: 'ja' | 'en'
    topics: { id: string; name: string; prompt: string }[]
    activeTopicId: string
    provider: 'grok' | 'auto' | 'openai' | 'anthropic' | 'gemini' | 'custom'
    apiKeys: {
        openai: string
        anthropic: string
        gemini: string
        custom: string
    }
    customApiUrl: string
    customModelName: string
    maxTweets: number
}

// Determine default language based on browser preference
const browserLang = navigator.language.startsWith('ja') ? 'ja' : 'en';

const defaultSettings: Settings = {
    aiModelReady: false,
    language: browserLang,
    topics: [
        {
            id: 'default',
            name: 'Default Xpaper',
            prompt: getLocale(browserLang).defaultUserPrompt
        }
    ],
    activeTopicId: 'default',
    provider: 'grok',
    apiKeys: {
        openai: '',
        anthropic: '',
        gemini: '',
        custom: ''
    },
    customApiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    customModelName: '',
    maxTweets: 50
}

function App() {
    const [settings, setSettings] = useState<Settings>(defaultSettings)
    const [isSaved, setIsSaved] = useState(false)

    // Load settings and check AI capabilities on mount
    useEffect(() => {
        const loadSettings = async () => {
            const data = await chrome.storage.local.get('xpaper_settings');
            if (data.xpaper_settings) {
                const loadedSettings = { ...defaultSettings, ...data.xpaper_settings };

                // Decrypt API keys before rendering them to the UI
                if (loadedSettings.apiKeys) {
                    const decryptedKeys: Record<string, string> = {};
                    for (const [provider, encryptedKey] of Object.entries(loadedSettings.apiKeys)) {
                        decryptedKeys[provider] = encryptedKey ? await decryptText(String(encryptedKey)) : '';
                    }
                    loadedSettings.apiKeys = decryptedKeys as any;
                }

                setSettings(loadedSettings);
            }
        };
        loadSettings();

        // Check Chrome Built-in AI readiness
        const checkAiReady = async () => {
            const ai = window.ai || (window as any).ai;
            if (!ai || !ai.languageModel) {
                updateSettings({ aiModelReady: false });
                return;
            }
            try {
                // Handle both new .availability() and legacy .capabilities() methods
                if (typeof ai.languageModel.availability === 'function') {
                    const status = await ai.languageModel.availability();
                    updateSettings({ aiModelReady: status === 'readily' || status === 'available' });
                } else if (typeof (ai.languageModel as any).capabilities === 'function') {
                    const capabilities = await (ai.languageModel as any).capabilities();
                    updateSettings({ aiModelReady: capabilities.available === 'readily' || capabilities.available === 'available' });
                } else {
                    updateSettings({ aiModelReady: false });
                }
            } catch (e) {
                updateSettings({ aiModelReady: false });
            }
        }
        checkAiReady()
    }, [])

    // Auto-save settings whenever they change
    useEffect(() => {
        // Prevent saving defaultSettings on initial mount before load completes
        if (settings === defaultSettings) return;

        const saveSettings = async () => {
            const settingsToSave = { ...settings };

            // Encrypt API keys before writing to LevelDB
            if (settingsToSave.apiKeys) {
                const encryptedKeys: Record<string, string> = {};
                for (const [provider, plaintextKey] of Object.entries(settingsToSave.apiKeys)) {
                    encryptedKeys[provider] = plaintextKey ? await encryptText(plaintextKey) : '';
                }
                settingsToSave.apiKeys = encryptedKeys as any;
            }

            chrome.storage.local.set({ xpaper_settings: settingsToSave }, () => {
                setIsSaved(true)
                setTimeout(() => setIsSaved(false), 2000)
            })
        };

        saveSettings();
    }, [settings])

    const updateSettings = (partial: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...partial }))
    }

    return (
        <div className="options-container">
            <header className="options-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Xpaper <span className="badge">Options</span></h1>
                    <p className="subtitle">Configure your personal Xpaper AI settings.</p>
                </div>
                {isSaved && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.875rem' }}>
                        <Save size={16} />
                        <span>Saved</span>
                    </div>
                )}
            </header>

            <main className="options-main">
                <ProviderConfig settings={settings} updateSettings={updateSettings} />
                <PromptConfig settings={settings} updateSettings={updateSettings} />
            </main>
        </div>
    )
}

export default App
