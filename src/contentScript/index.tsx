import { createRoot } from 'react-dom/client';
import App from './Overlay';
import overlayCss from './overlay.css?inline';
import { TweetData } from '../lib/twitter-parser';

// Content script for extracting data from X (Twitter) and rendering the Overlay

console.log('Xpaper content script loaded')

import { extractTweetsWithScrolling } from '../lib/tweet-extractor';

// Function to extract tweets from the DOM with scrolling
const extractTweets = async (maxTweets: number = 30, maxScrolls: number = 10, signal?: AbortSignal): Promise<TweetData[]> => {
    return extractTweetsWithScrolling(maxTweets, maxScrolls, signal);
};

// --- React Shadow DOM Injection ---

function initOverlay() {
    // Prevent double injection
    if (document.getElementById('xpaper-overlay-host')) return;

    // Create Host
    const hostElement = document.createElement('div');
    hostElement.id = 'xpaper-overlay-host';

    // Anchor the host to cover the screen so we can center the panel, but let clicks pass through
    Object.assign(hostElement.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        zIndex: '2147483647',
        pointerEvents: 'none', // Let clicks pass through the host wrapper itself
        display: 'block'
    });

    document.body.appendChild(hostElement);

    // Attach Shadow DOM (Closed mode prevents X.com page JS from reading the content)
    const shadowRoot = hostElement.attachShadow({ mode: 'closed' });

    // Sync Theme with X.com
    const syncTheme = () => {
        const bg = window.getComputedStyle(document.body).backgroundColor;
        // Twitter dark modes: "rgb(0, 0, 0)" and "rgb(21, 32, 43)" (Dim)
        if (bg.includes('rgb(0, 0, 0)') || bg.includes('rgb(21, 32, 43)')) {
            hostElement.setAttribute('data-theme', 'dark');
        } else {
            hostElement.removeAttribute('data-theme');
        }
    };
    syncTheme();

    // Watch for theme changes on Twitter
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    // Inject Stylesheet inside the Shadow DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = overlayCss;
    shadowRoot.appendChild(styleElement);

    const mountPoint = document.createElement('div');
    mountPoint.id = 'xpaper-mount';
    // pointerEvents: 'auto' will be handled by the React components themselves inside the CSS
    mountPoint.style.pointerEvents = 'none';
    shadowRoot.appendChild(mountPoint);

    // Render React
    const root = createRoot(mountPoint);
    // Pass the extraction function down as a prop so the React component can trigger it
    root.render(<App extractFn={extractTweets} />);
}

// Initialize immediately
initOverlay();

// Initialize immediately
initOverlay();
