const https = require('https');

/**
 * OpenAI Service for generating text completions using native Node.js HTTPS
 * 
 * Usage:
 * const { generateResponse } = require('./services/openAI');
 * const response = await generateResponse('Your prompt here');
 */

/**
 * Make a request to OpenAI API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request payload
 * @param {string} method - HTTP method (default: 'POST')
 * @returns {Promise<Object>} - API response
 */
function makeOpenAIRequest(endpoint, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return reject(new Error('OPENAI_API_KEY environment variable is not set'));
    }

    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: `/v1/${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`OpenAI API error (${res.statusCode}): ${parsedData.error?.message || 'Unknown error'}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse OpenAI API response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Set timeout (30 seconds)
    req.setTimeout(30000);

    req.write(postData);
    req.end();
  });
}

/**
 * Generate a response from OpenAI based on the provided prompt
 * @param {string} prompt - The input prompt for OpenAI
 * @param {Object} options - Additional options for the request
 * @param {string} options.model - The model to use (default: 'gpt-3.5-turbo')
 * @param {number} options.maxTokens - Maximum number of tokens in response (default: 1000)
 * @param {number} options.temperature - Controls randomness (0-2, default: 0.7)
 * @returns {Promise<string>} - The generated response
 */
async function generateResponse(prompt, options = {}) {
  try {
    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    // Default options
    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7,
    } = options;

    // Prepare request data
    const requestData = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    };

    // Make request to OpenAI
    const response = await makeOpenAIRequest('chat/completions', requestData);

    // Extract and return the response text
    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content.trim();
    } else {
      throw new Error('No response received from OpenAI');
    }
  } catch (error) {
    console.error('Error in OpenAI service:', error.message);
    throw error;
  }
}

/**
 * Generate a response using GPT-4 model (requires GPT-4 access)
 * @param {string} prompt - The input prompt
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - The generated response
 */
async function generateResponseGPT4(prompt, options = {}) {
  return generateResponse(prompt, { ...options, model: 'gpt-4' });
}

/**
 * Generate a completion for a specific task with system message
 * @param {string} systemMessage - The system message to set context
 * @param {string} userPrompt - The user's prompt
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - The generated response
 */
async function generateCompletionWithSystem(systemMessage, userPrompt, options = {}) {
  try {
    if (!systemMessage || typeof systemMessage !== 'string') {
      throw new Error('System message must be a non-empty string');
    }

    if (!userPrompt || typeof userPrompt !== 'string') {
      throw new Error('User prompt must be a non-empty string');
    }

    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7,
    } = options;

    const requestData = {
      model: model,
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    };

    const response = await makeOpenAIRequest('chat/completions', requestData);

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content.trim();
    } else {
      throw new Error('No response received from OpenAI');
    }
  } catch (error) {
    console.error('Error in OpenAI completion with system:', error.message);
    throw error;
  }
}

/**
 * Generate text completion using older completion models (e.g., text-davinci-003)
 * @param {string} prompt - The input prompt
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - The generated response
 */
async function generateTextCompletion(prompt, options = {}) {
  try {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    const {
      model = 'text-davinci-003',
      maxTokens = 1000,
      temperature = 0.7,
    } = options;

    const requestData = {
      model: model,
      prompt: prompt,
      max_tokens: maxTokens,
      temperature: temperature,
    };

    const response = await makeOpenAIRequest('completions', requestData);

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].text.trim();
    } else {
      throw new Error('No response received from OpenAI');
    }
  } catch (error) {
    console.error('Error in OpenAI text completion:', error.message);
    throw error;
  }
}

/**
 * Check if OpenAI API key is valid
 * @returns {Promise<boolean>} - True if API key is valid
 */
async function validateApiKey() {
  try {
    await makeOpenAIRequest('models', null, 'GET');
    return true;
  } catch (error) {
    console.error('API key validation failed:', error.message);
    return false;
  }
}

module.exports = {
  generateResponse,
  generateResponseGPT4,
  generateCompletionWithSystem,
  generateTextCompletion,
  validateApiKey,
};