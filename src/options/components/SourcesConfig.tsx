import { Settings } from '../App'

type Props = {
    settings: Settings
    updateSettings: (partial: Partial<Settings>) => void
}

export default function SourcesConfig(_props: Props) {
    return (
        <section className="config-section">
            <h2>3. Source Targets</h2>
            <p className="help-text" style={{ marginBottom: '1rem', marginTop: '-0.5rem' }}>
                Xpaper only processes content explicitly targeted for distillation to keep operations safe and intentional.
            </p>

            <div className="form-group">
                <label>Primary Target</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#374151', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>𝕏</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: '#f3f4f6' }}>X.com (Twitter)</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Active Tab Clipping</div>
                    </div>
                    <span className="badge" style={{ background: '#10b981' }}>Enabled</span>
                </div>
                <p className="help-text" style={{ marginTop: '0.5rem' }}>
                    Navigate to an X.com page and use the extension popup to extract content safely without background scraping.
                </p>
            </div>
        </section>
    )
}
