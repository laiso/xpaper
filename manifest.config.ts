import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Xpaper',
  description: 'Craft your personal newsletter with AI',
  version: '1.0.0',
  permissions: ['storage'],
  host_permissions: [
    'https://x.com/*',
    'https://twitter.com/*',
    'https://*/*',
    'http://localhost/*',
    'http://127.0.0.1/*',
    'http://[::1]/*'
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'"
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  action: {},
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  content_scripts: [
    {
      matches: ['https://x.com/*', 'https://twitter.com/*'],
      js: ['src/contentScript/index.tsx'],
    },
  ],
})
