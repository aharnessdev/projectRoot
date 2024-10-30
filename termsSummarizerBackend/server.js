// Importing required modules
const express = require('express'); // Express framework for building web servers
const bodyParser = require('body-parser'); // Middleware to parse incoming request bodies
const cors = require('cors'); // Middleware to enable Cross-Origin Resource Sharing
const axios = require('axios'); // Module to make HTTP requests

// Create an instance of the express application
const app = express();

// Middleware setup
app.use(bodyParser.json({ limit: '10mb' })); // Set up bodyParser to handle JSON requests with a size limit of 10MB
app.use(cors()); // Enable CORS to allow requests from different origins

// POST endpoint to summarize text
app.post('/summarize', async (req, res) => {
  console.log('Received POST request to /summarize');
  const { text } = req.body; // Extracting "text" from the request body
  console.log('Text length:', text.length); // Logging the length of the input text for debugging

  try {
    // Constructing the prompt to send to the Ollama model
    const prompt = `Your job is to provide a thorough review of the terms and conditions provided to the end user so they know what they are signing off on. Please note that the formatting may be a little strange because this is pulled straight from the webpage. Please provide a summary of of the following terms and conditions, making note of each major point. Please provide a succinct paragraph at the end that includes any potential implications that come with signing the terms and conditions.

"${text}"

Summary:`;

    // Call the Ollama model to generate the summary
    const ollamaResponse = await callOllamaModel(prompt);
    console.log('Ollama model response:', ollamaResponse); // Logging the response from the Ollama model

    // Sending the generated summary as a JSON response
    res.json({ summary: ollamaResponse });
  } catch (error) {
    console.error('Error in /summarize route:', error); // Log any errors that occur during the process
    res.status(500).json({ summary: 'Error summarizing terms.' }); // Send an error response if something goes wrong
  }
});

// Setting up the server to listen on a specific port
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`); // Log to indicate that the server is running
});

// Function to call the Ollama model for generating the summary
async function callOllamaModel(prompt) {
  try {
    console.log('Calling Ollama model with prompt...');

    // Make a POST request to the Ollama model API
    const response = await axios({
      method: 'post',
      url: 'http://localhost:11434/api/generate', // URL of the Ollama model API
      data: {
        model: 'llama3.2:latest', // Specify the model to use; replace with the actual model name
        prompt: prompt // Provide the prompt to the model
      },
      responseType: 'stream' // Expect a streaming response from the API
    });

    let generatedText = '';
    const stream = response.data;

    // Return a Promise that resolves when the entire response has been processed
    return new Promise((resolve, reject) => {
      // Listen for data chunks from the stream
      stream.on('data', (chunk) => {
        const chunkStr = chunk.toString('utf8').trim(); // Convert the chunk to a UTF-8 string

        // Handle multiple JSON objects in the chunk (if they exist)
        const jsonStrings = chunkStr.split('\n'); // Split the chunk into individual JSON strings
        jsonStrings.forEach(jsonStr => {
          if (jsonStr) {
            try {
              const jsonData = JSON.parse(jsonStr); // Parse the JSON string
              if (jsonData.response) {
                generatedText += jsonData.response; // Append the response text to the generatedText variable
              }
            } catch (err) {
              console.error('Error parsing JSON chunk:', err); // Log parsing errors if they occur
            }
          }
        });
      });

      // Listen for the end of the stream
      stream.on('end', () => {
        if (!generatedText) {
          reject(new Error('Generated text is missing from Ollama response.')); // Reject if no text was generated
        } else {
          console.log('Generated text:', generatedText); // Log the generated text
          resolve(generatedText); // Resolve the Promise with the generated text
        }
      });

      // Listen for errors in the response stream
      stream.on('error', (error) => {
        console.error('Error in response stream:', error); // Log stream errors if they occur
        reject(error); // Reject the Promise with the error
      });
    });
  } catch (error) {
    console.error('Error calling Ollama model:', error); // Log errors related to the API call
    throw error; // Rethrow the error to be handled by the caller
  }
}
