import { Settings } from '../App'
import { t } from '../../lib/i18n'

type Props = {
    settings: Settings
    updateSettings: (partial: Partial<Settings>) => void
}

export default function SourcesConfig(_props: Props) {
    return (
        <section className="config-section">
            <h2>{t('sourceTargetsHeading')}</h2>
            <p className="help-text" style={{ marginBottom: '1rem', marginTop: '-0.5rem' }}>
                {t('sourceTargetsDesc')}
            </p>

            <div className="form-group">
                <label>{t('primaryTarget')}</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#374151', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>𝕏</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: '#f3f4f6' }}>{t('xcomTwitter')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t('activeTabClipping')}</div>
                    </div>
                    <span className="badge" style={{ background: '#10b981' }}>{t('enabled')}</span>
                </div>
                <p className="help-text" style={{ marginTop: '0.5rem' }}>
                    {t('sourceTargetHelp')}
                </p>
            </div>
        </section>
    )
}
