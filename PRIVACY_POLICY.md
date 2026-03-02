# Privacy Policy for Xpaper

Last updated: March 2, 2026

## Overview

Xpaper is a Chrome extension that summarizes your X (Twitter) timeline using AI. This privacy policy explains how we handle your data.

## Data Collection

Xpaper does NOT collect, store, or transmit any personal data to external servers (except for AI API processing as described below).

### What We Don't Collect
- No browsing history
- No personal information
- No timeline data stored on our servers
- No analytics or tracking

## How the Extension Works

1. **Timeline Data**: Your X (Twitter) timeline is read locally in your browser
2. **AI Processing**: Timeline content is sent directly to your chosen AI provider (Google Gemini, Anthropic Claude, OpenAI, OpenRouter, or local LLM)
3. **Results**: Summarized content is displayed in your browser

## API Keys

- API keys are encrypted and stored locally in Chrome's storage
- Keys are only used to communicate with your selected AI provider
- We do not store or have access to your API keys

## Permissions

### storage
Used to save your settings locally (AI provider selection, API keys, language preferences, custom prompts). Data never leaves your browser.

### host_permissions
- `https://x.com/*` and `https://twitter.com/*`: Required to read your timeline for summarization
- `https://*/*`: Required for cloud AI API calls (Gemini, Claude, OpenAI, etc.)
- `http://localhost/*`, `http://127.0.0.1/*`, `http://*.local/*`: Required for local LLM connections (Ollama, LM Studio)

## Third-Party Services

When you use cloud AI providers, your timeline content is sent to:
- Google Gemini (if selected)
- Anthropic Claude (if selected)
- OpenAI (if selected)
- OpenRouter (if selected)

These services have their own privacy policies. We recommend reviewing them before use.

## Local LLM

If you use local LLMs (Ollama, LM Studio), all processing happens on your local machine. No data is sent externally.

## Data Security

- All data stays in your browser
- API keys are encrypted before storage
- No data is sold or shared with third parties (except AI providers you choose)

## Children's Privacy

Xpaper is not intended for users under 13 years of age. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy. Changes will be reflected in this document with an updated date.

## Contact

For privacy concerns, please contact: xpaper@lai.so

## Compliance

Xpaper complies with:
- Chrome Web Store Developer Program Policies
- GDPR (no personal data collection)
- CCPA (no sale of personal information)
