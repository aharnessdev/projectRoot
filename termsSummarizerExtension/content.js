console.log('Content script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message in content script:', request);

  if (request.action === 'scrapeTerms') {
    console.log('Starting to scrape terms...');

    try {
      let termsText = '';
      const selectors = [
        '#terms', '.terms',
        '#terms-and-conditions', '.terms-and-conditions',
        '#terms_of_service', '.terms_of_service',
        '#tos', '.tos',
        '#terms-of-service', '.terms-of-service'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          termsText += element.innerText + '\n';
        });
      }

      if (!termsText) {
        console.log('No specific terms found, using full page text.');
        termsText = document.body.innerText;
      }

      console.log('Terms text length:', termsText.length);

      fetch('http://localhost:3000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: termsText })
      })
        .then(response => {
          console.log('Received response from backend:', response);
          return response.json();
        })
        .then(data => {
          console.log('Backend returned data:', data);
          if (data && data.summary) {
            console.log('Backend returned summary:', data.summary);
            sendResponse({ summary: data.summary });
          } else {
            console.error('Summary is undefined or missing in the response data.');
            sendResponse({ summary: 'Error summarizing terms.' });
          }
        })
        .catch(error => {
          console.error('Error during fetch:', error);
          sendResponse({ summary: 'Error summarizing terms.' });
        });

      // Return true to indicate asynchronous response
      return true;
    } catch (error) {
      console.error('Exception in content script:', error);
      sendResponse({ summary: 'Error summarizing terms.' });
    }
  }
});
