// Log that the content script has been loaded
console.log('Content script loaded');

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message in content script:', request); // Log the received message for debugging

  // Check if the action requested is to scrape terms
  if (request.action === 'scrapeTerms') {
    console.log('Starting to scrape terms...');

    try {
      let termsText = ''; // Initialize an empty string to store the scraped terms
      // Array of CSS selectors to identify terms and conditions sections on the page
      const selectors = [
        // Existing selectors
        '#terms', '.terms',
        '#terms-and-conditions', '.terms-and-conditions',
        '#terms_of_service', '.terms_of_service',
        '#tos', '.tos',
        '#terms-of-service', '.terms-of-service',
      
        // Additional common selectors
        '#legal', '.legal',
        '#legal-notice', '.legal-notice',
        '#user-agreement', '.user-agreement',
        '#user-agreements', '.user-agreements',
        '#agreement', '.agreement',
        '#service-agreement', '.service-agreement',
        '#service_agreement', '.service_agreement',
        '#termsOfUse', '.termsOfUse',
        '#terms_of_use', '.terms_of_use',
        '#termsUse', '.termsUse',
        '#terms-use', '.terms-use',
        '#termsConditions', '.termsConditions',
        '#terms_conditions', '.terms_conditions',
        '#termsConditions', '.termsConditions',
        '#termsConditions', '.termsConditions',
        '#termsConditions', '.termsConditions',
      
        // Privacy-related selectors (if applicable)
        '#privacy', '.privacy',
        '#privacy-policy', '.privacy-policy',
        '#privacy_policy', '.privacy_policy',
        '#privacyPolicy', '.privacyPolicy',
      
        // Disclaimer selectors
        '#disclaimer', '.disclaimer',
      
        // Footer-specific selectors
        'footer #terms', 'footer .terms',
        'footer #legal', 'footer .legal',
        'footer #privacy-policy', 'footer .privacy-policy',
        'footer #user-agreement', 'footer .user-agreement',
      
        // Common container classes
        '.legal-container', '.terms-container',
        '.terms-content', '.legal-content',
        '.agreement-container', '.agreement-content',
      
        // Alternative naming conventions
        '#termsService', '.termsService',
        '#termsservice', '.termsservice',
        '#termsofservice', '.termsofservice',
        '#termsOfService', '.termsOfService',
        '#terms_service', '.terms_service',
      
        // Combined selectors for more specificity
        'div#terms', 'div.terms',
        'section#terms-and-conditions', 'section.terms-and-conditions',
        'div#terms_of_service', 'div.terms_of_service',
        'section#tos', 'section.tos',
        'div#terms-of-service', 'div.terms-of-service',
      
        // Attribute selectors (if IDs or classes contain keywords)
        '[id*="terms"]', '[class*="terms"]',
        '[id*="agreement"]', '[class*="agreement"]',
        '[id*="legal"]', '[class*="legal"]',
        '[id*="policy"]', '[class*="policy"]',
        '[id*="tos"]', '[class*="tos"]',
        '[id*="privacy"]', '[class*="privacy"]',
        '[id*="disclaimer"]', '[class*="disclaimer"]',
      
        // Case-insensitive selectors (Note: CSS selectors are case-sensitive by default,
        // but if your crawler supports case-insensitive matching, these can be useful)
        '#Terms', '.Terms',
        '#TERMS', '.TERMS',
        // Add more case variations as needed
      ];
      

      // Loop through each selector and find matching elements
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector); // Get all elements matching the selector
        elements.forEach(element => {
          termsText += element.innerText + '\n'; // Append the text content of each element to termsText
        });
      }

      // If no specific terms are found, fallback to using the entire page text
      if (!termsText) {
        console.log('No specific terms found, using full page text.');
        termsText = document.body.innerText;
      }

      console.log('Terms text length:', termsText.length); // Log the length of the extracted terms text

      // Send the scraped terms to the backend for summarization
      fetch('http://localhost:3000/summarize', {
        method: 'POST', // HTTP method to use for the request
        headers: { 'Content-Type': 'application/json' }, // Set the content type to JSON
        body: JSON.stringify({ text: termsText }) // Send the extracted terms as JSON in the request body
      })
        .then(response => {
          console.log('Received response from backend:', response); // Log the response from the backend
          return response.json(); // Parse the response as JSON
        })
        .then(data => {
          console.log('Backend returned data:', data); // Log the data returned by the backend
          // Check if the backend returned a summary
          if (data && data.summary) {
            console.log('Backend returned summary:', data.summary); // Log the summary returned by the backend
            sendResponse({ summary: data.summary }); // Send the summary back to the sender
          } else {
            console.error('Summary is undefined or missing in the response data.'); // Log an error if the summary is missing
            sendResponse({ summary: 'Error summarizing terms.' }); // Send an error response
          }
        })
        .catch(error => {
          console.error('Error during fetch:', error); // Log any errors that occur during the fetch
          sendResponse({ summary: 'Error summarizing terms.' }); // Send an error response
        });

      // Return true to indicate that the response will be sent asynchronously
      return true;
    } catch (error) {
      console.error('Exception in content script:', error); // Log any exceptions that occur
      sendResponse({ summary: 'Error summarizing terms.' }); // Send an error response
    }
  }
});
