/**
 * Popup ViewModel
 * Handles the interaction between the popup view and the model
 */
document.addEventListener('DOMContentLoaded', function() {
  const extractButton = document.getElementById('extractText');
  const statusDiv = document.getElementById('status');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Statistics elements
  const totalSegmentsEl = document.getElementById('total-segments');
  const totalCharsEl = document.getElementById('total-chars');
  const hiraganaPercentEl = document.getElementById('hiragana-percent');
  const katakanaPercentEl = document.getElementById('katakana-percent');
  const kanjiPercentEl = document.getElementById('kanji-percent');
  
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  extractButton.addEventListener('click', async () => {
    statusDiv.textContent = 'Extracting Japanese text...';
    
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        statusDiv.textContent = 'Error: Could not find active tab.';
        return;
      }
      
      console.log('Sending message to tab:', tab.id);
      
      // First, ensure the content script is injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/models/JapaneseTextModel.js', 'src/content/content.js']
      });
      
      // Now send the message to the content script
      const result = await chrome.tabs.sendMessage(tab.id, { 
        action: 'extractJapaneseText',
        from: 'popup'
      });
      
      console.log('Received result:', result);
      
      if (result && result.japaneseText) {
        if (result.japaneseText.length > 0) {
          // Update text tab
          let statusText = `Found ${result.japaneseText.length} Japanese text segments\n\n`;
          
          // Add the text segments
          result.japaneseText.forEach((text, index) => {
            statusText += `${index+1}. ${text}\n\n`;
          });
          
          statusDiv.textContent = statusText;
          
          // Update statistics tab
          const stats = result.statistics;
          totalSegmentsEl.textContent = stats.totalSegments;
          totalCharsEl.textContent = stats.totalCharacters;
          
          // Calculate percentages
          const hiraganaPercent = Math.round(stats.hiraganaCount/stats.totalCharacters*100);
          const katakanaPercent = Math.round(stats.katakanaCount/stats.totalCharacters*100);
          const kanjiPercent = Math.round(stats.kanjiCount/stats.totalCharacters*100);
          
          hiraganaPercentEl.textContent = `${hiraganaPercent}%`;
          katakanaPercentEl.textContent = `${katakanaPercent}%`;
          kanjiPercentEl.textContent = `${kanjiPercent}%`;
          
          // Log to console for debugging
          console.log('Extracted Japanese text:', result.japaneseText);
          console.log('Statistics:', result.statistics);
        } else {
          statusDiv.textContent = 'No Japanese text found on this page.';
          resetStatistics();
        }
      } else {
        statusDiv.textContent = 'Error: Could not extract text. Try refreshing the page.';
        resetStatistics();
      }
    } catch (error) {
      statusDiv.textContent = `Error: ${error.message || 'Unknown error occurred'}`;
      console.error('Error extracting Japanese text:', error);
      resetStatistics();
    }
  });
  
  // Function to reset statistics display
  function resetStatistics() {
    totalSegmentsEl.textContent = '0';
    totalCharsEl.textContent = '0';
    hiraganaPercentEl.textContent = '0%';
    katakanaPercentEl.textContent = '0%';
    kanjiPercentEl.textContent = '0%';
  }
}); 