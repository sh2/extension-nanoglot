# AGENTS.md

## Project overview

Chrome extension that translates selected text locally using Chrome's Built-in AI (Language Detector API and Translator API). All processing happens on-device — no API key, no external server. Available in Chrome 138 and later.

- **Platform:** Chrome Extension Manifest V3 (Chrome only)
- **Language:** Vanilla JavaScript (ES modules) — no TypeScript, no bundler, no framework
- **AI backend:** Chrome Built-in AI (`self.LanguageDetector`, `self.Translator`)
- **Version source:** `extension/manifest.json`

## Core rules

- All Built-in AI calls (`LanguageDetector`, `Translator`) live in `extension/popup.js`.
- Keep changes inside `extension/` unless the task is specifically about root-level config (`package.json`, `eslint.config.mjs`).
- Do not edit files in `extension/lib/`.
- Always use block braces `{}` for control statements such as `if`, `else`, `for`, and `while` (brace-less single-line statements like `if (cond) return;` are strictly prohibited).

## Task routing

- Popup UI, text selection, language detection, translation, streaming display: `extension/popup.html` and `extension/popup.js`
- Options UI, target language/theme/font size settings: `extension/options.html` and `extension/options.js`
- Shared utilities, theme/font helpers, template loading, markdown rendering: `extension/utils.js`
- Dropdown templates: `extension/templates.html`
- Localized strings: `extension/_locales/*/messages.json`
- Vendored libraries: `extension/lib/`

## Validation

- After code changes, run `npm run lint` and fix relevant errors before finishing.
- When updating the extension version, update `extension/manifest.json`.

## Notes

- `extension/manifest.json` defines the unpacked extension structure, permissions, and the `Alt+N` command.
- There is no background service worker and no separate results page; the popup handles the full flow.
- No Firefox build is maintained.

## Updating vendored libraries

The files under `extension/lib/` are third-party libraries. Do not edit them in place. When updating, replace them with the latest minified builds downloaded from jsDelivr.

Current vendored files:

| File | Package | jsDelivr URL template |
| --- | --- | --- |
| `extension/lib/marked.umd.min.js` | `marked` | `https://cdn.jsdelivr.net/npm/marked@<version>/lib/marked.umd.min.js` |
| `extension/lib/purify.min.js` | `dompurify` | `https://cdn.jsdelivr.net/npm/dompurify@<version>/dist/purify.min.js` |

Steps to update:

1. Check the latest version on npm or GitHub for each package listed above.
2. Download the minified build for the new version from the jsDelivr URL template, preserving the exact file names under `extension/lib/`.
3. Do not modify the downloaded file contents.
4. Run `npm run lint` after replacing the files.
5. Verify the version strings in the file headers (e.g. `marked@14.1.2`, `DOMPurify 3.1.7`).
