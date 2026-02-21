# Xpaper

[![Security Audited by AI](https://img.shields.io/badge/Security_Audited_by-Multi_AI-blue?style=for-the-badge)](./SECURITY-REVIEW.md)

![Xpaper Demo](./demo.gif)
![Xpaper Options](./options.png)

Xpaper is a Chrome extension that curates and summarizes your X (Twitter) timeline into a clean, readable newsletter format using various LLM providers (Google Gemini, Anthropic Claude, OpenAI, or custom APIs).

This project adheres to rigorous security standards. The entire codebase and architecture have been aggressively audited and hardened by multiple advanced AI models. Vulnerabilities such as XSS, DNS Rebinding, and plaintext credential storage have been systematically eliminated. 

For detailed audit methodology and current security status, refer to [SECURITY-REVIEW.md](./SECURITY-REVIEW.md).

## Prerequisites
- Node.js (v18 or higher recommended)
- Bun (or npm/yarn)
- Google Chrome

## Installation and Setup

1. Clone the repository
git clone <repository-url>
cd xpaper

2. Install dependencies
bun install

3. Build the extension
bun run build

## Loading the Extension in Chrome

1. Open Google Chrome and navigate to chrome://extensions/
2. Enable "Developer mode" in the top right corner.
3. Click "Load unpacked" in the top left corner.
4. Select the "dist" folder located inside your cloned xpaper directory.

## Development

To run the development server with Hot Module Replacement (HMR):
bun run dev

To run tests:
bun run test

## Configuration

After loading the extension, click on the Xpaper extension icon or open the Options page to configure:
1. Your preferred AI Provider (e.g. Gemini, Anthropic, Custom OpenRouter API)
2. Your API Key for the selected provider.
3. Output language and custom summarization prompts.

Note: Xpaper relies on your local browser state and does not store your timeline data on any external servers. LLM inference requires a valid API key unless you are using experimental Chrome Built-in AI features.
