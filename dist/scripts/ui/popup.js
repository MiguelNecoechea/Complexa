"use strict";
/**
 * Popup Script for Japanese Learning Tool
 */
document.addEventListener('DOMContentLoaded', () => {
    // Enable Readings button
    const enableReadingsBtn = document.getElementById('enable-readings');
    if (enableReadingsBtn) {
        enableReadingsBtn.addEventListener('click', () => {
            // Functionality will be added later
            console.log('Enable readings clicked');
        });
    }
    // Enable Dictionary button
    const enableDictionaryBtn = document.getElementById('enable-dictionary');
    if (enableDictionaryBtn) {
        enableDictionaryBtn.addEventListener('click', () => {
            // Functionality will be added later
            console.log('Enable dictionary clicked');
        });
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
