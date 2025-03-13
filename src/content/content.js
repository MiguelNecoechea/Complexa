// Create an instance of the JapaneseTextModel
const japaneseModel = new JapaneseTextModel();

// Function to extract Japanese text from the page
function extractJapaneseText() {
  // Get all text nodes in the document
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip empty text nodes and nodes in script/style elements
        if (node.nodeValue.trim() === '' || 
            ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentNode.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  // Extract text from text nodes
  const textSegments = textNodes.map(node => node.nodeValue.trim())
    .filter(text => text.length > 0);

  // Process the text segments using the model
  const result = japaneseModel.processJapaneseText(textSegments);
  
  // Log to console for debugging
  console.log('Japanese text extraction result:', result);
  
  return result;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.action === 'extractJapaneseText') {
    const result = extractJapaneseText();
    sendResponse({ 
      japaneseText: result.segments,
      statistics: result.statistics
    });
    
    // Also send to background script for logging
    chrome.runtime.sendMessage({
      action: 'logJapaneseText',
      text: result.segments,
      statistics: result.statistics
    });
  }
  return true; // Required for async response
}); 