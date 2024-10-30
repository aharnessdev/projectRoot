const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

app.post('/summarize', async (req, res) => {
  console.log('Received POST request to /summarize');
  const { text } = req.body;
  console.log('Text length:', text.length);

  try {
    const prompt = `Please provide a concise summary of the following terms and conditions:

"${text}"

Summary:`;

    // Call the Ollama model
    const ollamaResponse = await callOllamaModel(prompt);
    console.log('Ollama model response:', ollamaResponse);

    res.json({ summary: ollamaResponse });
  } catch (error) {
    console.error('Error in /summarize route:', error);
    res.status(500).json({ summary: 'Error summarizing terms.' });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Function to call the Ollama model
async function callOllamaModel(prompt) {
  try {
    console.log('Calling Ollama model with prompt...');

    const response = await axios({
      method: 'post',
      url: 'http://localhost:11434/api/generate',
      data: {
        model: 'llama3.2:latest', // Replace with your actual model name
        prompt: prompt
      },
      responseType: 'stream'
    });

    let generatedText = '';
    const stream = response.data;

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        const chunkStr = chunk.toString('utf8').trim();

        // Handle multiple JSON objects in the chunk
        const jsonStrings = chunkStr.split('\n');
        jsonStrings.forEach(jsonStr => {
          if (jsonStr) {
            try {
              const jsonData = JSON.parse(jsonStr);
              if (jsonData.response) {
                generatedText += jsonData.response;
              }
            } catch (err) {
              console.error('Error parsing JSON chunk:', err);
            }
          }
        });
      });

      stream.on('end', () => {
        if (!generatedText) {
          reject(new Error('Generated text is missing from Ollama response.'));
        } else {
          console.log('Generated text:', generatedText);
          resolve(generatedText);
        }
      });

      stream.on('error', (error) => {
        console.error('Error in response stream:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error calling Ollama model:', error);
    throw error;
  }
}

