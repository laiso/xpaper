# Security Review Log

## Document Rules
- Manage reviews by date (`YYYY-MM-DD`) and add a new section for each new review.
- Keep newest review section at the top.
- Record each finding using: `Severity / File / Risk / Recommendation / Status`.
- For accepted risks, use: `Status: Accepted (Reason: Requirement)`.

## Review: 2026-02-21

### Model Context
- Model date: 2026-02-21

### Model Comparison
| Model | Setting | Primary Role | Notes |
|---|---|---|---|
| gpt-5.3-codex | medium | Final document normalization and consolidation | Unified duplicate/fragmented notes into one operational log |
| Sonnet 4.6 | High effort | Deep review (auth, key handling, URL validation, XSS) | Produced detailed fix candidates |
| gemini-3.1-pro-preview | Standard | Cross-check on permissions, external transfer, storage policy | Validated major findings |

### Status Summary
#### Resolved
- Removed `anthropic-dangerous-direct-browser-access` header (`src/lib/llm-providers.ts`).
- Migrated API key handling from plaintext persistence to encrypted flow (`src/options/App.tsx`, `src/background/index.ts`, `src/lib/crypto.ts`).
- Replaced `startsWith` URL checks with `new URL()`-based validation (`src/background/index.ts`).
- Strengthened message validation using `sender.url` in addition to `sender.id` (`src/background/index.ts`).
- Added Markdown sanitization and stricter link handling (`src/contentScript/Overlay.tsx`).
- Removed duplicate custom API auth header usage (`src/lib/llm-providers.ts`).
- Added upper-bound control to tweet collection map (`src/lib/tweet-extractor.ts`).
- Confirmed extracted timeline data is not persisted to backend DB or `chrome.storage.local`; it stays in volatile extension memory and is discarded after use.

#### Accepted (Requirement)
- Wide `host_permissions` in `manifest.config.ts` is accepted for arbitrary endpoint support.
- External LLM transfer of timeline content is accepted as core product concept.

#### Deferred
- Standardize dependency vulnerability scanning workflow aligned with lockfile strategy.

### Next Improvements
1. Finalize and document SCA workflow (`npm`/`bun` lockfile compatible).

---

## Template: Add New Review Date
Copy the block below and append a new date section above older entries.

```md
## Review: YYYY-MM-DD

### Model Context
- Model date: YYYY-MM-DD
- Project: /path/to/project

### Model Comparison
| Model | Setting | Primary Role | Notes |
|---|---|---|---|
| ... | ... | ... | ... |

### Delta Summary
#### Added
- ...

#### Resolved
- ...

#### Accepted (Requirement)
- ...

#### Deferred
- ...

### Findings
| Severity | File | Risk | Recommendation | Status |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |
```
