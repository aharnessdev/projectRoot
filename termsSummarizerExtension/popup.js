document.getElementById('summarize-btn').addEventListener('click', () => {
  console.log('Summarize button clicked');
  document.getElementById('summary').innerText = 'Summarizing...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: 'scrapeTerms' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error in popup.js:', chrome.runtime.lastError.message);
          document.getElementById('summary').innerText = 'Error: ' + chrome.runtime.lastError.message;
        } else {
          console.log('Received response from content script:', response);
          if (response && response.summary) {
            document.getElementById('summary').innerText = response.summary;
          } else {
            document.getElementById('summary').innerText = 'No summary available.';
          }
        }
      }
    );
  });
});
