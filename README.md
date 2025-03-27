# Japanese Learning Tool Chrome Extension

A Chrome extension for learning Japanese with reading and dictionary features. This extension uses a glassmorphic design with custom CSS for the UI.

## Features

- Enable readings for Japanese text
- Enable dictionary lookups
- Open a dedicated app page for more features

## Development Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Compile TypeScript files:
   ```
   npm run build
   ```

3. For continuous development:
   ```
   npm run watch
   ```

## Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right corner)
3. Click "Load unpacked" and select the root directory of this project
4. The extension should now appear in your Chrome toolbar

## Project Structure

This project follows the MVVM (Model-View-ViewModel) architecture:

```
├── assets/
│   └── icons/
│       ├── Modular48.png
│       └── Modular128.png
├── dist/            # Compiled JavaScript files
│   └── scripts/
│       ├── content/ # Content scripts
│       ├── models/  # Data models
│       └── ui/      # UI-related scripts
├── src/
│   ├── scripts/     # TypeScript source files
│   │   ├── content/ # Content scripts
│   │   ├── models/  # Data models
│   │   └── ui/      # UI-related scripts
│   ├── styles/      # CSS files
│   │   ├── colors.css      # Color scheme
│   │   ├── glassmorphism.css # Glassmorphism effects
│   │   ├── popup.css       # Popup-specific styles
│   │   └── app.css         # App-specific styles
│   └── views/       # HTML files
│       ├── app.html
│       └── popup.html
├── manifest.json    # Extension configuration
├── package.json     # Project dependencies
└── tsconfig.json    # TypeScript configuration
```

## Using the Extension

1. Click on the extension icon in the Chrome toolbar to open the popup
2. Use the provided buttons to enable readings or dictionary lookups on the current page
3. Click "Launch App" to open the full application page 