# extension-nanoglot

Privacy-focused Chrome extension to translate web pages locally using Chrome's Built-in AI. No API key required — all processing happens on your device.

## Prerequisites

This extension uses Chrome's built-in [Language Detector API](https://developer.chrome.com/docs/ai/language-detection) and [Translator API](https://developer.chrome.com/docs/ai/translator-api), available in Chrome 138 and later. No additional flags or settings are required.

The required language models will be downloaded automatically on first use. Ensure you have an active network connection when using the extension for the first time with a new language pair.

For more information, please refer to [Built-in AI APIs | Chrome for Developers](https://developer.chrome.com/docs/ai/built-in-apis).

## Setup

The following are instructions for manual installation, for development purposes.

1. Open 'Manage Extensions' page in Google Chrome browser.
2. Enable 'Developer mode'.
3. Click 'Load unpacked' and select `extension` directory.
4. Open 'Options' page and select the language for translation.

## Usage

Select the text you want to translate and click on the extension icon (or press `Alt+N`). The extension automatically detects the source language and translates it to your selected target language.

## Features

- **Automatic Language Detection**: The source language is automatically detected using Chrome's Language Detector API.
- **Local Translation**: All translation is performed locally on your device using Chrome's Built-in AI. No data is sent to external servers.
- **Streaming Output**: Translation results are displayed progressively as they are generated.
- **Keyboard Shortcut**: Press `Alt+N` to quickly translate selected text.
- **Theme Support**: Choose between Light, Dark, or System theme.
- **Font Size**: Adjustable font size (Small, Medium, Large).

## License

MIT License  
Copyright (c) 2026 Sadao Hiratsuka
