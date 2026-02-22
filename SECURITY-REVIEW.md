---
project: Xpaper
last_audit: 2026-02-22
status: SECURE_FOR_OSS
reviewers:
  - Claude Sonnet 4.6
  - OpenAI GPT-5.3 Codex
  - Gemini 3.1 Pro
  - Devin Review
---

# Security Review Log

This document serves as a cumulative log of security audits and hardening measures for the Xpaper extension.

### Audit Methodology
The following commands were used to trigger the multi-AI security review:
```bash
# Review Prompt:
# "Review this git diff for a Chrome Extension. We are allowing the extension to call local network endpoints 
# (like 192.168.x.x, *.local, or localhost) over HTTP to communicate with local LLMs (like Ollama or LM Studio). 
# Are there any critical security vulnerabilities or risks introduced by these changes?"

cat changes.patch | claude -p "$PROMPT"
cat changes.patch | codex exec "$PROMPT"
cat changes.patch | gemini -p "$PROMPT"
```

---

## [2026-02-22] Audit: Local LLM Integration & Network Hardening

### Reviewers
- **AI Consensus**: Claude Sonnet 4.6, GPT-5.3 Codex, Gemini 3.1 Pro

### Summary
Implemented robust local network detection to allow communication with local LLMs (Ollama, LM Studio) while strictly preventing data exfiltration to non-HTTPS public endpoints.

### Hardening Details
1. **Host Permission Restriction**: Removed broad `http://*/*` permissions; limited to `localhost` and `*.local`.
2. **SSRF Hardening**: Implemented regex-based IP validation in [network.ts](src/lib/network.ts) to block hostnames like `10.evil.com`.
3. **CORS compatibility**: Added logic to strip `HTTP-Referer` and `X-Title` for local headers to avoid 403 errors.
4. **Mixed Content mandate**: Explicitly enforced HTTPS for all non-local API URLs.

### Verdict
**SECURE FOR OSS DISTRIBUTION**.

---

## [2026-02-21] Audit: Settings Storage & Model Validation

### Reviewers
- **AI Consensus**: Claude Sonnet 4.6, GPT-5.3 Codex, Gemini 3.1 Pro

### Summary
Audited the persistence layer and extension messaging to ensure user settings and API keys are stored securely and retrieved without fallbacks.

### Hardening Details
1. **Storage Isolation**: Migrated sensitive configurations (API keys, prompts) from `sync` to `local` storage.
2. **Retrieve Logic Validation**: Hardened model name retrieval to eliminate `undefined` payloads and ensure correct provider-model mapping.
3. **DOM Integrity**: Cleaned up redundant `initOverlay` calls to prevent script injection side-effects.

