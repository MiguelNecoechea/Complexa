import Tab = chrome.tabs.Tab;

/**
 * Service class for interacting with Chrome browser tabs in a Chrome extension.
 *
 * This class provides utility methods for working with Chrome tabs, including
 * retrieving the active tab, sending messages to tabs, and injecting scripts.
 *
 * @class TabService
 */
export class TabService {
    /**
     * Gets the currently active tab in the current window.
     *
     * @method getActiveTab
     * @returns {Promise<chrome.tabs.Tab | null>} A promise that resolves to the active tab object,
     *   or null if no active tab is found.
     */
    async getActiveTab(): Promise<chrome.tabs.Tab | null> {
        return new Promise((resolve): void => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs: Tab[]): void => {
                resolve(tabs[0] || null);
            });
        });
    }

    /**
     * Sends a message to a specific tab and returns the response.
     *
     * @method sendMessageToTab
     * @template T The expected type of the response (defaults to any)
     * @param {number} tabId - The ID of the tab to send the message to
     * @param {any} message - The message content to send to the tab
     * @returns {Promise<T>} A promise that resolves with the tab's response
     * @throws Will reject with Chrome runtime errors if message sending fails
     */
    async sendMessageToTab<T = any>(tabId: number, message: any): Promise<T> {
        console.log("tab id: ", tabId);
        console.log("message: ", message);
        return new Promise((resolve, reject): void => {
            chrome.tabs.sendMessage(tabId, message, (response: any): void => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve(response);
            });
        });
    }

    /**
     * Injects a JavaScript file into a specific tab.
     *
     * @method injectScript
     * @param {number} tabId - The ID of the tab to inject the script into
     * @param {string} scriptPath - The path to the JavaScript file to inject
     * @returns {Promise<void>} A promise that resolves when the script is successfully injected
     * @throws Will throw an error if script injection fails
     */
    async injectScript(tabId: number, scriptPath: string): Promise<void> {
        try {
            await chrome.scripting.executeScript({target: { tabId }, files: [scriptPath]});
        } catch (error) {
            console.error("Error injecting script: ", error);
            throw error;
        }
    }


}
