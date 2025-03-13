# Japanese Learning Assistant Chrome Extension

A Chrome extension designed to help users learn Japanese by extracting Japanese text from web pages.

## Features

- Extracts Japanese text (Hiragana, Katakana, and Kanji) from web pages
- Filters out non-Japanese text
- Displays extracted text in the extension popup
- Provides statistics about the extracted text
- Logs extracted text to the console for debugging

## Project Structure

The project follows the MVVM (Model-View-ViewModel) architecture:

```
├── assets/
│   └── images/
│       └── icon.png
├── src/
│   ├── background/
│   │   └── background.js
│   ├── content/
│   │   └── content.js
│   ├── models/
│   │   └── JapaneseTextModel.js
│   ├── styles/
│   │   └── popup.css
│   ├── views/
│   │   └── popup.html
│   ├── viewmodels/
│   │   └── popup.js
│   └── utils/
└── manifest.json
```

- **Model**: `src/models/JapaneseTextModel.js` - Contains the data processing logic for Japanese text extraction
- **View**: `src/views/popup.html` - The UI components with tabs for text, statistics, and about
- **ViewModel**: `src/viewmodels/popup.js` - Connects the UI to the data model
- **Content Script**: `src/content/content.js` - Extracts text from web pages
- **Background Script**: `src/background/background.js` - Handles background tasks and initialization

## How to Use

1. Install the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extension directory
2. Navigate to a webpage containing Japanese text
3. Click on the extension icon to open the popup
4. Click the "Extract Japanese Text" button
5. View the extracted Japanese text in the "Text" tab and statistics in the "Statistics" tab

## Development

This extension follows the MVVM (Model-View-ViewModel) architecture:
- **Model**: The data processing logic in JapaneseTextModel.js
- **View**: The UI components in popup.html
- **ViewModel**: The popup.js file that connects the UI to the data model

## Future Enhancements

- Add text-to-speech functionality for pronunciation practice
- Implement dictionary lookup for selected Japanese words
- Add flashcard creation for vocabulary learning
- Implement spaced repetition system for memorization
- Add grammar analysis for sentence structure learning 