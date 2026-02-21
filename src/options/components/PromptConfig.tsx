import { Settings } from '../App'
import { RotateCcw } from 'lucide-react'

import { getLocale } from '../../lib/locales'

type Props = {
    settings: Settings
    updateSettings: (partial: Partial<Settings>) => void
}

export default function PromptConfig({ settings, updateSettings }: Props) {
    const handlePromptChange = (val: string) => {
        // Basic implementation for MVP, edits the first/default topic
        const newTopics = [...settings.topics]
        newTopics[0].prompt = val
        updateSettings({ topics: newTopics })
    }

    const handleResetPrompt = () => {
        const locale = getLocale(settings.language)
        handlePromptChange(locale.defaultUserPrompt)
    }

    return (
        <section className="config-section">
            <h2>2. AI Processing Rules</h2>
            <div className="form-group">
                <label htmlFor="aiLanguage">Output Language</label>
                <select
                    id="aiLanguage"
                    value={settings.language || 'ja'}
                    onChange={(e) => {
                        const newLang = e.target.value as 'ja' | 'en';
                        const oldLang = settings.language || 'ja';

                        const oldLocale = getLocale(oldLang);
                        const newLocale = getLocale(newLang);
                        const newTopics = [...settings.topics];

                        // Only auto-translate the prompt if the user hasn't customized it
                        if (newTopics[0].prompt === oldLocale.defaultUserPrompt || newTopics[0].prompt === '') {
                            newTopics[0].prompt = newLocale.defaultUserPrompt;
                        }

                        updateSettings({ language: newLang, topics: newTopics });
                    }}
                    className="text-input"
                    style={{ marginBottom: '16px' }}
                >
                    <option value="ja">Japanese</option>
                    <option value="en">English</option>
                </select>
            </div>

            <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label htmlFor="aiPrompt" style={{ marginBottom: 0 }}>System Prompt for Xpaper</label>
                    <button
                        onClick={handleResetPrompt}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                        title="Reset to recommended default prompt"
                    >
                        <RotateCcw size={12} />
                        Reset to Default
                    </button>
                </div>
                <textarea
                    id="aiPrompt"
                    value={settings.topics[0]?.prompt || ''}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    className="textarea-input"
                    placeholder="Instruct the AI how to format and filter the information..."
                />
                <p className="help-text">
                    Customize how the AI evaluates and reformats extracted text. E.g., "Summarize in 3 bullet points, output as JSON."
                </p>
            </div>
        </section>
    )
}
