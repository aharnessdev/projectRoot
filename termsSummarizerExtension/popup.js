// Add click event listener to the summarize button
document.getElementById('summarize-btn').addEventListener('click', () => {
  console.log('Summarize button clicked'); // Log when the summarize button is clicked

  // Set the summary container text to indicate summarization is in progress
  document.getElementById('summary').innerText = 'Summarizing...';

  // Query the currently active tab in the current window
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Send a message to the content script in the active tab to scrape the terms
    chrome.tabs.sendMessage(
      tabs[0].id, // The ID of the active tab
      { action: 'scrapeTerms' }, // Message containing the action to perform (scrape terms)
      (response) => { // Callback to handle the response from the content script
        // Check if there was an error during message passing
        if (chrome.runtime.lastError) {
          console.error('Error in popup.js:', chrome.runtime.lastError.message); // Log the error
          document.getElementById('summary').innerText = 'Error: ' + chrome.runtime.lastError.message; // Display error message in the summary container
        } else {
          console.log('Received response from content script:', response); // Log the received response

          // Check if a summary was returned in the response
          if (response && response.summary) {
            document.getElementById('summary').innerText = response.summary; // Display the summary in the summary container
          } else {
            document.getElementById('summary').innerText = 'No summary available.'; // Display a fallback message if no summary is available
          }
        }
      }
    );
  });
});
