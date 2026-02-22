import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Sparkles, X, Check, Loader2, Copy, Settings as SettingsIcon } from 'lucide-react';
import { Settings } from '../options/App';
import { buildPrompt, buildGrokPrompt } from '../lib/prompt-builder';
import { formatApiResponse } from '../lib/result-formatter';
import { getLocale, SupportedLanguage } from '../lib/locales';
type Props = {
    extractFn: (maxTweets?: number, maxScrolls?: number, signal?: AbortSignal) => Promise<any[]>;
};

const GrokIcon = ({ size = 20 }: { size?: number }) => (
    <svg viewBox="0 0 33 32" width={size} height={size} fill="currentColor" aria-hidden="true">
        <g><path d="M12.745 20.54l10.97-8.19c.539-.4 1.307-.244 1.564.38 1.349 3.288.746 7.241-1.938 9.955-2.683 2.714-6.417 3.31-9.83 1.954l-3.728 1.745c5.347 3.697 11.84 2.782 15.898-1.324 3.219-3.255 4.216-7.692 3.284-11.693l.008.009c-1.351-5.878.332-8.227 3.782-13.031L33 0l-4.54 4.59v-.014L12.743 20.544m-2.263 1.987c-3.837-3.707-3.175-9.446.1-12.755 2.42-2.449 6.388-3.448 9.852-1.979l3.72-1.737c-.67-.49-1.53-1.017-2.515-1.387-4.455-1.854-9.789-.931-13.41 2.728-3.483 3.523-4.579 8.94-2.697 13.561 1.405 3.454-.899 5.898-3.22 8.364C1.49 30.2.666 31.074 0 32l10.478-9.466"></path></g>
    </svg>
);

const GrokLink = ({ href, children, ...props }: any) => {
    // Security: Prevent XSS via javascript: or data: URIs in LLM markdown output
    const safeHref = href && href.startsWith('https://') ? href : '#unsafe-link';

    const [isHovered, setIsHovered] = useState(false);
    return (
        <span
            className="grok-link-wrapper"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
            <a style={{ color: "var(--accent-color)", textDecoration: 'none' }} target="_blank" rel="noopener noreferrer" href={safeHref} {...props}>
                {children}
            </a>
            {/* Show Grok button next to link only if it's an x.com link */}
            {isHovered && safeHref !== '#unsafe-link' && (safeHref.includes('x.com') || safeHref.includes('twitter.com')) && (
                <button
                    onClick={(e) => {
                        e.preventDefault(); // Prevent a tag click propagation
                        e.stopPropagation();
                        window.open(`https://x.com/i/grok?text=${encodeURIComponent(safeHref)}`, '_blank');
                    }}
                    title="Ask Grok about this post"
                    style={{
                        background: 'var(--hover-bg)', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-primary)', padding: '4px', borderRadius: '50%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    <GrokIcon size={14} />
                </button>
            )}
        </span>
    );
};

export default function App({ extractFn }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState<{ count: number, result?: string } | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [activeProvider, setActiveProvider] = useState<string>('grok');
    const [extractionPhase, setExtractionPhase] = useState<'idle' | 'scrolling' | 'generating'>('idle');
    const abortControllerRef = useRef<AbortController | null>(null);

    // Initial Provider Load
    useEffect(() => {
        chrome.storage.local.get('xpaper_settings', (data) => {
            const settings = data.xpaper_settings as Partial<Settings>;
            if (settings?.provider) {
                setActiveProvider(settings.provider);
            }
        });
    }, []);

    // Listen to Background script directly to open UI (No window events to prevent X.com spoofing)
    useEffect(() => {
        const messageListener = (request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
            if (request.action === 'TOGGLE_OVERLAY') {
                setIsOpen(prev => !prev);
                sendResponse({ success: true });
            }
            return false;
        };
        chrome.runtime.onMessage.addListener(messageListener);
        return () => chrome.runtime.onMessage.removeListener(messageListener);
    }, []);

    // Auto-retry extraction when API Key is set in Options page
    useEffect(() => {
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
            if (namespace === 'local' && changes.xpaper_settings) {
                const newVal = changes.xpaper_settings.newValue as Partial<Settings> || {};
                if (newVal?.provider) {
                    setActiveProvider(newVal.provider);
                }
                setExtractedData(prev => {
                    if (prev?.result === 'MISSING_KEY') {
                        // User just saved their API key. Automatically retry directly instead of via Window Event.
                        setTimeout(() => handleExtract(), 300);
                        return null; // Clear the error state immediately
                    }
                    return prev;
                });
            }
        };
        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    // Load saved state on mount manually via storage, as popping open is a fresh mount
    useEffect(() => {
        try {
            chrome.storage.local.get(['xpaper_overlay_state'], (res: any) => {
                if (res?.xpaper_overlay_state) {
                    // Always force isExtracting to false on a fresh mount (e.g. reload or first open)
                    // This prevents stuck loading states if the user refreshed the page mid-extraction
                    setIsExtracting(false);
                    setExtractedData(res.xpaper_overlay_state.extractedData || null);
                }
            });
        } catch (e) {
            console.warn("Chrome Extension context likely invalidated. Page needs refresh.", e);
        }
    }, []);

    const updateState = (extracting: boolean, data: { count: number, result?: string } | null) => {
        setIsExtracting(extracting);
        setExtractedData(data);
        if (!extracting) setExtractionPhase('idle');
        try {
            chrome.storage.local.set({
                xpaper_overlay_state: {
                    isExtracting: extracting,
                    extractedData: data
                }
            });
        } catch (e) {
            console.warn("Chrome Extension context likely invalidated. Page needs refresh.", e);
        }
    };

    const handleCopy = async (text: string | undefined) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };


    const onClose = () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setIsOpen(false);
        updateState(false, null);
    };

    const openOptions = () => {
        try {
            chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS' });
        } catch (e) {
            alert("Extension updated. Please reload the page (F5).");
        }
    };

    const handleAskGrokRaw = async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        // Clear previous data first so we don't flash the expanded state
        setExtractionPhase('scrolling');
        updateState(true, null);
        setIsOpen(true);

        try {
            const storage = await chrome.storage.local.get('xpaper_settings');
            const settings = storage.xpaper_settings as Partial<Settings> || {};

            // Grok URL length limitation check: Cap the extraction count to ~15 
            // to prevent long scrolling for tweets that will just be discarded anyway.
            const maxTweets = Math.min(settings?.maxTweets || 50, 15);

            // 1. Extract Tweets from the live DOM (capped at max 10 scrolls for speed)
            const tweetsData = await extractFn(maxTweets, 10, abortControllerRef.current.signal);

            // If aborted, don't proceed
            if (abortControllerRef.current.signal.aborted) {
                updateState(false, null);
                return;
            }

            if (!tweetsData || tweetsData.length === 0) {
                updateState(false, { count: 0, result: "No tweets found on the current screen." });
                return;
            }

            const activeLanguage = settings?.language || 'ja';
            const defaultActivePrompt = getLocale(activeLanguage as SupportedLanguage).defaultUserPrompt;
            const sysPrompt = settings?.topics?.[0]?.prompt || defaultActivePrompt;

            const fullPrompt = buildGrokPrompt(tweetsData, sysPrompt, activeLanguage);

            // Revert state back since we are opening Grok in a new tab with everything
            updateState(false, null);
            setIsOpen(false);

            const url = `https://x.com/i/grok?text=${encodeURIComponent(fullPrompt)}`;
            window.open(url, '_blank');

        } catch (err: any) {
            console.error('Extraction flow failed:', err);
            updateState(false, {
                count: 0,
                result: `Error: ${err.message || 'Unknown error occurred.'}`
            });
        }
    };

    const handleExtract = async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        // Clear previous data first so we don't flash the expanded state
        setExtractionPhase('scrolling');
        updateState(true, null);
        setIsOpen(true);

        try {
            // Fetch User Settings
            const storage = await chrome.storage.local.get('xpaper_settings');
            const settings = storage.xpaper_settings as Partial<Settings> || {};
            const provider = settings?.provider || 'gemini';

            const activeLanguage = settings?.language || 'ja';
            const defaultActivePrompt = getLocale(activeLanguage as SupportedLanguage).defaultUserPrompt;

            const activePrompt = settings?.topics?.[0]?.prompt || defaultActivePrompt;
            const maxTweets = settings?.maxTweets || 50;

            // 1. Extract Tweets from the live DOM
            const dynamicMaxScrolls = Math.max(20, Math.ceil(maxTweets * 1.5));
            const tweetsData = await extractFn(maxTweets, dynamicMaxScrolls, abortControllerRef.current.signal);

            // If aborted, don't proceed
            if (abortControllerRef.current.signal.aborted) {
                updateState(false, null);
                return;
            }

            if (!tweetsData || tweetsData.length === 0) {
                updateState(false, { count: 0, result: "No tweets found on the current screen." });
                return;
            }

            setExtractionPhase('generating');

            // 2. Format Prompts
            const modelName = settings?.customModelName || '';
            const { systemPrompt: sysPrompt, userPrompt: fullPrompt } = buildPrompt(tweetsData, activePrompt, activeLanguage);

            let cleanResult = '';

            // 3. Routing Logic (Local AI vs Cloud Service Worker Routing)
            if (provider !== 'auto' && provider !== 'grok') {
                // Route explicitly selected Cloud LLM to the Background Worker
                const customApiUrl = settings?.customApiUrl;
                console.log(`Routing inference to Background (Provider: ${provider})`);

                const response = await chrome.runtime.sendMessage({
                    action: 'CALL_LLM_API',
                    payload: { provider, modelName, sysPrompt, fullPrompt, customApiUrl }
                });

                if (!response.success) throw new Error(response.error);
                cleanResult = response.result;

            } else {
                // Auto Flow: Try Chrome Built-in AI Locally First
                const ai: any = window.ai || (window as any).ai || (window as any).LanguageModel;
                let builtinAiAvailable = false;
                if (ai && (ai.languageModel || typeof ai.create === 'function')) {
                    builtinAiAvailable = true;
                }

                if (builtinAiAvailable) {
                    try {
                        console.log('Attempting Chrome Built-in AI...');
                        const modelApi: any = ai.languageModel || ai;
                        const session = await modelApi.create({
                            systemPrompt: sysPrompt,
                            expectedOutputs: [{ type: 'text', languages: [activeLanguage] }]
                        });
                        cleanResult = await session.prompt(fullPrompt);
                        if (typeof session.destroy === 'function') session.destroy();
                    } catch (err) {
                        console.warn('Chrome Built-in AI failed, falling back to gemini...', err);
                        builtinAiAvailable = false;
                    }
                }

                // If Built-in AI failed or wasn't available, we don't fallback anymore. We just throw an error.
                if (!cleanResult) {
                    throw new Error("Chrome Built-in AI is not available or failed to generate text. Please ensure it is enabled in chrome://flags.");
                }
            }

            // 4. Cleanup and Save
            cleanResult = formatApiResponse(cleanResult, activeLanguage);

            updateState(false, { count: tweetsData.length, result: cleanResult });

        } catch (err: any) {
            console.error('Extraction flow failed:', err);

            if (err.message === 'MISSING_KEY' || err.message?.includes('MISSING_KEY')) {
                updateState(false, { count: 0, result: 'MISSING_KEY' });
                return;
            }

            // Handle context invalidation explicitly
            const isContextInvalidated = err.message && err.message.includes('Extension context invalidated');
            const errorMessage = isContextInvalidated
                ? '⚠️ Extension was updated. Please reload (F5) the X.com tab.'
                : `Error: ${err.message || 'Unknown error occurred.'}`;

            updateState(false, {
                count: extractedData?.count || 0,
                result: errorMessage
            });
        }
    };

    const isExpanded = !!extractedData && !isExtracting && extractedData.count > 0;

    return (
        <>
            <button
                className={`xpaper-fab ${isOpen ? 'hidden' : ''}`}
                onClick={() => {
                    if (activeProvider === 'grok') {
                        handleAskGrokRaw();
                    } else {
                        handleExtract();
                    }
                }}
                title={activeProvider === 'grok' ? "Summarize with Grok" : "Publish Xpaper"}
            >
                <Sparkles size={24} />
            </button>
            <div className={`xpaper-backdrop ${isOpen && isExpanded ? 'open' : ''}`} onClick={onClose} />

            <div className={`xpaper-panel ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded-mode' : ''}`}>
                <header className="xpaper-header">
                    <div className="header-left">
                        <h1>Xpaper</h1>
                    </div>
                    <div className="header-right">
                        <button className="icon-btn" onClick={openOptions} title="Settings">
                            <SettingsIcon size={20} />
                        </button>
                        <button className="icon-btn close-btn" onClick={onClose} title="Close">
                            <X size={24} />
                        </button>
                    </div>
                </header>

                <main className="xpaper-main">
                    {!isExtracting && !extractedData && (
                        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                <Sparkles size={48} style={{ color: 'var(--accent-color)', opacity: 0.5 }} />
                            </div>
                            <h2 style={{ fontFamily: 'inherit', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Ready to Publish</h2>
                            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Click the button below to curate your timeline into a personalized edition.
                            </p>
                        </div>
                    )}

                    {isExtracting && (
                        <div className="extracting-state">
                            <Loader2 className="spinner" size={48} />
                            <p>{extractionPhase === 'scrolling' ? 'Scrolling timeline...' : 'Generating Xpaper...'}</p>
                        </div>
                    )}

                    {extractedData && (
                        <div className="result-state">
                            <div className="result-header">
                                <Check size={16} />
                                <span>Processed {extractedData.count} items</span>
                            </div>

                            <div className="result-card">
                                {extractedData.result === 'MISSING_KEY' ? (
                                    <div style={{ textAlign: 'center', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '50%' }}>
                                            <SettingsIcon size={32} />
                                        </div>
                                        <h2 style={{ fontFamily: 'inherit', fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>API Key Required</h2>
                                        <p style={{ fontFamily: 'inherit', margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You need to set up a Cloud LLM API Key (like Google Gemini) to start distilling.</p>
                                        <button className="primary-button" onClick={openOptions} style={{ marginTop: '8px' }}>
                                            <SettingsIcon size={20} />
                                            <span>Open Settings</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="xpaper-result xpaper-prose" style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                        <ReactMarkdown
                                            rehypePlugins={[rehypeSanitize]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="md-h1" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="md-h2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="md-h3" {...props} />,
                                                p: ({ node, ...props }) => <p className="md-p" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="md-ul" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="md-ol" {...props} />,
                                                li: ({ node, ...props }) => <li className="md-li" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="md-strong" {...props} />,
                                                a: GrokLink,
                                            }}
                                        >
                                            {extractedData.result || ''}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>

                            {/* The copy button is moved to the footer now */}
                        </div>
                    )}

                </main>

                <div className="action-footer">
                    {!isExtracting && (
                        <>
                            {extractedData && extractedData.count > 0 && extractedData.result && !extractedData.result.startsWith('Error') && extractedData.result !== 'MISSING_KEY' && (
                                <button className="secondary-button" style={{ width: '100%' }} onClick={() => handleCopy(extractedData.result!)}>
                                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                                    <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Result'}</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
