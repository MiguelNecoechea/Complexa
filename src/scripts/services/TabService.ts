export class TabService {
  async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0] || null);
      });
    });
  }

  async sendMessageToTab<T = any>(tabId: number, message: any): Promise<T> {
    console.log("tab id: ", tabId);
    console.log("message: ", message);
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  async injectScript(tabId: number, scriptPath: string): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [scriptPath],
      });
    } catch (error) {
      console.error("Error injecting script: ", error);
      throw error;
    }
  }
}
