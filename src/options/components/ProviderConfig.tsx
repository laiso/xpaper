import { useState } from 'react'
import { Settings } from '../App'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { DEFAULT_MODELS } from '../../lib/constants'
import { isIPAddress } from '../../lib/network'

type Props = {
    settings: Settings
    updateSettings: (partial: Partial<Settings>) => void
}

export default function ProviderConfig({ settings, updateSettings }: Props) {
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)

    // Check if permission exists for the current custom origin
    const checkPermission = async (url: string) => {
        if (!url || !isIPAddress(url)) {
            setHasPermission(null)
            return
        }
        try {
            const origin = new URL(url).origin + '/*'
            const result = await chrome.permissions.contains({ origins: [origin] })
            setHasPermission(result)
        } catch (e) {
            setHasPermission(false)
        }
    }

    const requestPermission = async () => {
        if (!settings.customApiUrl) return
        try {
            const origin = new URL(settings.customApiUrl).origin + '/*'
            const granted = await chrome.permissions.request({ origins: [origin] })
            if (granted) setHasPermission(true)
        } catch (e) {
            console.error('Permission request failed', e)
        }
    }

    const handleApiKeyChange = (provider: keyof Settings['apiKeys'], value: string) => {
        updateSettings({
            apiKeys: {
                ...settings.apiKeys,
                [provider]: value
            }
        })
    }

    const defaultModelPlaceholder = DEFAULT_MODELS[settings.provider as keyof typeof DEFAULT_MODELS] || '';

    // Effect to check permission whenever URL changes
    useState(() => {
        if (settings.provider === 'custom' && settings.customApiUrl) {
            checkPermission(settings.customApiUrl)
        }
    })

    return (
        <section className="config-section">
            <h2>1. AI Provider Settings</h2>
            <p className="help-text" style={{ marginBottom: '16px' }}>
                Select your preferred AI Provider. The default is Google Gemini API.
            </p>

            <div className="form-group">
                <label>Active AI Provider</label>
                <select
                    className="select-input"
                    value={settings.provider}
                    onChange={(e) => {
                        const newProvider = e.target.value as Settings['provider'];
                        // Only overwrite if current customModelName is empty or if it's the specific default of the previous provider
                        const currentModel = (settings.customModelName || '') as string;
                        const isCurrentlyDefault = Object.values(DEFAULT_MODELS).includes(currentModel as any);

                        const update: any = { provider: newProvider };
                        if (!currentModel || isCurrentlyDefault) {
                            update.customModelName = DEFAULT_MODELS[newProvider as keyof typeof DEFAULT_MODELS] || '';
                        }

                        updateSettings(update);
                        if (newProvider === 'custom' && settings.customApiUrl) {
                            checkPermission(settings.customApiUrl);
                        }
                    }}
                >
                    <option value="grok">Grok Native</option>
                    <option value="gemini">Google Gemini API (Gemini 3 Flash)</option>
                    <option value="openai">OpenAI API (GPT-5 mini)</option>
                    <option value="anthropic">Anthropic API (Claude 4.5 Haiku)</option>
                    <option value="custom">Custom API (OpenRouter / Local)</option>
                    <option value="auto">Chrome Built-in AI [Experimental]</option>
                </select>

                {settings.provider === 'auto' && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#111827', padding: '10px 12px', borderRadius: '6px', border: '1px dashed #4b5563', fontSize: '0.85rem' }}>
                        <span className={`badge ${settings.aiModelReady ? 'saved' : ''}`} style={{ marginLeft: 0, background: settings.aiModelReady ? '#10b981' : '#ef4444', padding: '2px 6px', fontSize: '0.7rem' }}>
                            {settings.aiModelReady ? 'READY' : 'NOT READY'}
                        </span>
                        <span style={{ color: '#d1d5db' }}>
                            {settings.aiModelReady
                                ? 'Local Nano model is available and ready for inference.'
                                : 'Please ensure Chrome Built-in AI features are enabled.'}
                        </span>
                    </div>
                )}
            </div>

            {settings.provider === 'gemini' && (
                <div className="form-group nested-group" style={{ marginTop: '16px', paddingLeft: '16px', borderLeft: '2px solid #374151' }}>
                    <label>Google Gemini API Key</label>
                    <input
                        className="text-input"
                        type="password"
                        placeholder="AIzaSy..."
                        value={settings.apiKeys?.gemini || ''}
                        onChange={(e) => handleApiKeyChange('gemini', e.target.value)}
                    />
                    <p className="help-text" style={{ marginTop: '8px' }}>Required for Google Gemini API.</p>
                </div>
            )}

            {settings.provider === 'openai' && (
                <div className="form-group nested-group" style={{ marginTop: '16px', paddingLeft: '16px', borderLeft: '2px solid #374151' }}>
                    <label>OpenAI API Key</label>
                    <input
                        className="text-input"
                        type="password"
                        placeholder="sk-..."
                        value={settings.apiKeys?.openai || ''}
                        onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                    />
                </div>
            )}

            {settings.provider === 'anthropic' && (
                <div className="form-group nested-group" style={{ marginTop: '16px', paddingLeft: '16px', borderLeft: '2px solid #374151' }}>
                    <label>Anthropic API Key</label>
                    <input
                        className="text-input"
                        type="password"
                        placeholder="sk-ant-..."
                        value={settings.apiKeys?.anthropic || ''}
                        onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                    />
                </div>
            )}

            {settings.provider === 'custom' && (
                <div className="form-group nested-group" style={{ marginTop: '16px', paddingLeft: '16px', borderLeft: '2px solid #374151', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label>Custom API Base URL</label>
                        <input
                            className="text-input"
                            type="text"
                            placeholder="https://openrouter.ai/api/v1/chat/completions"
                            value={settings.customApiUrl || ''}
                            onChange={(e) => {
                                updateSettings({ customApiUrl: e.target.value });
                                checkPermission(e.target.value);
                            }}
                        />
                        <p className="help-text" style={{ marginTop: '8px' }}>The full ChatCompletion Endpoint URL (e.g. OpenRouter, LM Studio).</p>

                        {/* Dynamic Permission UI for Local IPs over HTTP */}
                        {settings.customApiUrl && isIPAddress(settings.customApiUrl) && settings.customApiUrl.startsWith('http:') && hasPermission === false && (
                            <div style={{ marginTop: '12px', background: '#3b0707', border: '1px solid #7f1d1d', padding: '12px', borderRadius: '6px' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5', marginBottom: '8px' }}>
                                    <strong>Access Required:</strong> Local IP addresses require explicit permission to be accessed over HTTP.
                                </p>
                                <button
                                    onClick={requestPermission}
                                    className="btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ef4444' }}
                                >
                                    Grant Browser Permission
                                </button>
                            </div>
                        )}
                        {settings.customApiUrl && isIPAddress(settings.customApiUrl) && settings.customApiUrl.startsWith('http:') && hasPermission === true && (
                            <p className="help-text" style={{ color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '1rem' }}>✓</span> Local network permission granted.
                            </p>
                        )}
                    </div>
                    <div>
                        <label>Custom API Key</label>
                        <input
                            className="text-input"
                            type="password"
                            placeholder="sk-or-v1-..."
                            value={settings.apiKeys?.custom || ''}
                            onChange={(e) => handleApiKeyChange('custom', e.target.value)}
                        />
                    </div>
                </div>
            )}

            {(settings.provider === 'openai' || settings.provider === 'anthropic' || settings.provider === 'gemini' || settings.provider === 'custom') && (
                <div className="form-group" style={{ marginTop: '24px' }}>
                    <label>Model Name</label>
                    <input
                        className="text-input"
                        type="text"
                        placeholder={defaultModelPlaceholder}
                        value={settings.customModelName ?? ''}
                        onChange={(e) => updateSettings({ customModelName: e.target.value })}
                    />
                    <p className="help-text" style={{ marginTop: '8px' }}>The specific model to use for inference. You can overwrite this to use other versions (e.g. gpt-4o).</p>
                </div>
            )}

            {/* Advanced Settings Toggle */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #374151', paddingTop: '16px' }}>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}
                >
                    {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span style={{ fontWeight: 600 }}>Advanced Provider Settings</span>
                </button>

                {showAdvanced && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '16px', borderLeft: '2px solid #374151' }}>
                        <div className="form-group">
                            <label htmlFor="maxTweetsInput">Max Tweets to Extract</label>
                            <input
                                id="maxTweetsInput"
                                className="text-input"
                                type="number"
                                min="1"
                                max="200"
                                value={settings.maxTweets === 0 ? '' : settings.maxTweets || 50}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    updateSettings({ maxTweets: isNaN(val) ? 0 : val });
                                }}
                            />
                            <p className="help-text" style={{ marginTop: '8px' }}>
                                Reduce this number to speed up distillation testing, or increase it for deeper context.
                                <br />
                                <strong style={{ color: '#d1d5db' }}>※ Note: When using "Grok Native", extraction is automatically capped at ~15 posts to avoid URL length errors.</strong>
                            </p>
                        </div>
                    </div>
                )}
            </div>

        </section>
    )
}
