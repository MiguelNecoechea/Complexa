// Initialize the extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Japanese Learning Assistant extension installed');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  console.log('Sender:', sender);
  
  if (message.action === 'logJapaneseText') {
    console.log('Japanese text from page:', message.text);
    // Here you could implement additional processing or storage of the text
    sendResponse({ success: true });
  }
  return true; // Required for async response
}); 