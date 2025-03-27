"use strict";
/**
 * Popup Script for Japanese Learning Tool
 */
// Default settings
const defaultSettings = {
    enableDictionary: false,
    enableReadings: false,
    enableTextSegmentation: false,
    enableWordFilters: false,
    enableQuiz: false,
    readingType: 'romaji'
};
document.addEventListener('DOMContentLoaded', () => {
    // Initialize settings from storage
    chrome.storage.sync.get(defaultSettings, (items) => {
        const settings = items;
        // Load saved settings for all checkboxes
        initializeCheckbox('enable-dictionary', settings.enableDictionary);
        initializeCheckbox('enable-readings', settings.enableReadings);
        initializeCheckbox('enable-text-segmentation', settings.enableTextSegmentation);
        initializeCheckbox('enable-word-filters', settings.enableWordFilters);
        initializeCheckbox('enable-quiz', settings.enableQuiz);
        // Initialize reading selector if needed
        if (settings.enableReadings) {
            createReadingSelector(settings.readingType);
        }
    });
    // Helper function to initialize checkbox state
    function initializeCheckbox(id, checked) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = checked;
        }
    }
    // Helper function to save settings
    function saveSettings(key, value) {
        chrome.storage.sync.get(defaultSettings, (items) => {
            const settings = items;
            const updatedSettings = { ...settings, [key]: value };
            chrome.storage.sync.set(updatedSettings, () => {
                console.log('Settings saved:', key, value);
            });
        });
    }
    // Enable Readings button
    const enableReadingsCheckbox = document.getElementById('enable-readings');
    if (enableReadingsCheckbox) {
        enableReadingsCheckbox.addEventListener('click', () => {
            const checkboxChecked = enableReadingsCheckbox.checked;
            saveSettings('enableReadings', checkboxChecked);
            const configsContainer = document.querySelector('.general-configs-container');
            const existingSelector = document.getElementById('reading-selector-wrapper');
            if (checkboxChecked && !existingSelector && configsContainer) {
                // Load the reading type from storage
                chrome.storage.sync.get(defaultSettings, (items) => {
                    const settings = items;
                    createReadingSelector(settings.readingType);
                });
            }
            else if (!checkboxChecked && existingSelector && configsContainer) {
                // Remove the selector if unchecked and it exists
                configsContainer.removeChild(existingSelector);
            }
        });
    }
    // Create the reading selector with the specified active type
    function createReadingSelector(activeType) {
        const configsContainer = document.querySelector('.general-configs-container');
        if (!configsContainer)
            return;
        // Create the split picker style selector
        const selectorWrapper = document.createElement('div');
        selectorWrapper.className = 'general-configs-item';
        selectorWrapper.id = 'reading-selector-wrapper';
        // Add a label for the selector
        const selectorLabel = document.createElement('div');
        selectorLabel.className = 'reading-selector-label';
        selectorLabel.textContent = 'Reading Type:';
        selectorWrapper.appendChild(selectorLabel);
        // Create the options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'reading-options';
        // Create options
        const options = [
            { value: 'romaji', label: 'Romaji' },
            { value: 'hiragana', label: 'Hiragana' }
        ];
        // Create and add each option
        options.forEach((option) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'reading-option' + (option.value === activeType ? ' active' : '');
            optionElement.dataset.value = option.value;
            optionElement.textContent = option.label;
            // Add click handler to update active state
            optionElement.addEventListener('click', () => {
                // Remove active class from all options
                document.querySelectorAll('.reading-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                // Add active class to clicked option
                optionElement.classList.add('active');
                // Save the selected value
                saveSettings('readingType', option.value);
            });
            optionsContainer.appendChild(optionElement);
        });
        // Add options container to wrapper
        selectorWrapper.appendChild(optionsContainer);
        // Add the element to the configs-container after the enable-readings checkbox
        const enableReadingsElement = enableReadingsCheckbox?.closest('.general-configs-item');
        if (enableReadingsElement && enableReadingsElement.nextSibling) {
            configsContainer.insertBefore(selectorWrapper, enableReadingsElement.nextSibling);
        }
        else {
            configsContainer.appendChild(selectorWrapper);
        }
    }
    // Add save functionality to all other checkboxes
    addSaveToCheckbox('enable-dictionary', 'enableDictionary');
    addSaveToCheckbox('enable-text-segmentation', 'enableTextSegmentation');
    addSaveToCheckbox('enable-word-filters', 'enableWordFilters');
    addSaveToCheckbox('enable-quiz', 'enableQuiz');
    // Helper function to add save functionality to checkboxes
    function addSaveToCheckbox(id, settingKey) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('click', () => {
                saveSettings(settingKey, checkbox.checked);
            });
        }
    }
    // Launch App button
    const launchAppBtn = document.getElementById('launch-app');
    if (launchAppBtn) {
        launchAppBtn.addEventListener('click', () => {
            // Open app.html in a new tab
            chrome.tabs.create({ url: chrome.runtime.getURL('src/views/app.html') });
            console.log('Launch app clicked');
        });
    }
});
