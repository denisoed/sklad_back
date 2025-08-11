# OpenAI Service

Service for working with OpenAI API without using npm libraries. Uses native Node.js HTTPS module for HTTP requests.

## Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

2. Set environment variable:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

Or add to your `.env` file:
```
OPENAI_API_KEY=your-api-key-here
```

## Usage

### Basic Text Generation

```javascript
const { generateResponse } = require('./services/openAI');

async function example() {
  try {
    const response = await generateResponse('Tell me about Node.js');
    console.log(response);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### With Custom Options

```javascript
const response = await generateResponse('Create a project plan', {
  model: 'gpt-4',           // Model to use
  maxTokens: 1500,          // Maximum response length
  temperature: 0.5          // Creativity level (0-2)
});
```

### Using System Message for Context

```javascript
const { generateCompletionWithSystem } = require('./services/openAI');

const systemMessage = 'You are a helpful coding assistant specializing in Node.js';
const userPrompt = 'How to create a REST API?';

const response = await generateCompletionWithSystem(systemMessage, userPrompt);
```

### GPT-4 Usage

```javascript
const { generateResponseGPT4 } = require('./services/openAI');

const response = await generateResponseGPT4('Analyze this code structure');
```

### Legacy Text Completion

```javascript
const { generateTextCompletion } = require('./services/openAI');

const response = await generateTextCompletion('The best way to learn programming is', {
  model: 'text-davinci-003',
  maxTokens: 100
});
```

### API Key Validation

```javascript
const { validateApiKey } = require('./services/openAI');

const isValid = await validateApiKey();
if (isValid) {
  console.log('API key is valid');
} else {
  console.log('API key is invalid');
}
```

## Available Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `generateResponse(prompt, options)` | Basic text generation | `prompt` (string), `options` (object) |
| `generateResponseGPT4(prompt, options)` | GPT-4 text generation | `prompt` (string), `options` (object) |
| `generateCompletionWithSystem(systemMessage, userPrompt, options)` | Generation with system context | `systemMessage` (string), `userPrompt` (string), `options` (object) |
| `generateTextCompletion(prompt, options)` | Legacy completion models | `prompt` (string), `options` (object) |
| `validateApiKey()` | Check API key validity | None |

## Options Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | `'gpt-3.5-turbo'` | OpenAI model to use |
| `maxTokens` | number | `1000` | Maximum tokens in response |
| `temperature` | number | `0.7` | Randomness (0-2) |

## Available Models

### Chat Models (Recommended)
- `gpt-4` - Most capable model
- `gpt-4-turbo` - Faster GPT-4 variant
- `gpt-3.5-turbo` - Fast and cost-effective

### Legacy Completion Models
- `text-davinci-003` - Most capable completion model
- `text-curie-001` - Fast for simple tasks
- `text-babbage-001` - Basic tasks
- `text-ada-001` - Simplest and fastest

## Error Handling

The service includes comprehensive error handling:

```javascript
try {
  const response = await generateResponse('Your prompt');
  console.log(response);
} catch (error) {
  if (error.message.includes('Invalid OpenAI API key')) {
    console.log('Check your API key');
  } else if (error.message.includes('rate limit')) {
    console.log('Too many requests, try again later');
  } else {
    console.log('Other error:', error.message);
  }
}
```

## Common Error Types

- **401 Unauthorized**: Invalid API key
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: OpenAI server error
- **Network Error**: Connection problems
- **Timeout**: Request took too long (30s limit)

## Example Integration with Strapi

```javascript
// In your Strapi controller
module.exports = {
  async generateContent(ctx) {
    try {
      const { prompt } = ctx.request.body;
      
      if (!prompt) {
        return ctx.badRequest('Prompt is required');
      }

      const { generateResponse } = require('../../../services/openAI');
      const response = await generateResponse(prompt);
      
      ctx.send({ content: response });
    } catch (error) {
      ctx.badRequest(error.message);
    }
  }
};
```

## Security Notes

- Never commit your API key to version control
- Use environment variables for API key storage
- Consider rate limiting in production
- Monitor API usage and costs
- Validate all inputs before sending to OpenAI

## Troubleshooting

### "OPENAI_API_KEY environment variable is not set"
Set your API key in environment variables or `.env` file.

### "Network error: Unable to reach OpenAI API"
Check your internet connection and firewall settings.

### "OpenAI API rate limit exceeded"
You've made too many requests. Wait before trying again or upgrade your plan.

### "Request timeout"
The request took longer than 30 seconds. Try a shorter prompt or check your connection.
