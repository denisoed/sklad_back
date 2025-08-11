const crypto = require("crypto");

function validateInitDataUnsafe(initData) {
  const urlSearchParams = new URLSearchParams(initData);
  const data = Object.fromEntries(urlSearchParams.entries());
  
  const checkString = Object.keys(data)
    .filter(key => key !== 'hash')
    .map(key => `${key}=${data[key]}`)
    .sort()
    .join('\n');
    
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_KEY)
    .digest();
    
  const signature = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');
  return data.hash === signature;
}

function validateWebTgAuthData(data) {
  const verificationData = { ...data };
  delete verificationData.hash;

  const dataToCheck = Object.keys(verificationData)
    .map(key => `${key}=${verificationData[key]}`)
    .sort()
    .join("\n");
  
  const secret = crypto.createHash('sha256')
    .update(process.env.TELEGRAM_BOT_KEY)
    .digest()
  const hmac = crypto.createHmac("sha256", secret)
    .update(dataToCheck)
    .digest("hex");
  return hmac === data.hash;
}

function recursiveParseValues(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return parseValue(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => recursiveParseValues(item));
  }
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = recursiveParseValues(value);
  }
  
  return result;
}

function parseValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Try to parse as JSON
  if (isJsonString(value)) {
    try {
      const decoded = decodeURIComponent(value);
      const parsed = JSON.parse(decoded);
      return recursiveParseValues(parsed);
    } catch (e) {
      // If JSON parsing fails, try without decoding
      try {
        const parsed = JSON.parse(value);
        return recursiveParseValues(parsed);
      } catch (e2) {
        // Continue to other parsing attempts
      }
    }
  }
  
  // Try to parse as number
  if (isNumericString(value)) {
    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }
  }
  
  // Try to parse as boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Try to decode URI component if it looks encoded
  if (value.includes('%')) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded !== value) {
        return parseValue(decoded);
      }
    } catch (e) {
      // If decoding fails, return original value
    }
  }
  
  // Return original string if no parsing was successful
  return value;
}

function isJsonString(str) {
  // Check if string looks like JSON (starts with { or [, or is quoted)
  const trimmed = str.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  );
}

function isNumericString(str) {
  // Check if string represents a number (including timestamps)
  return /^\d+$/.test(str) || /^\d+\.\d+$/.test(str);
}


function parseInitData(initData) {
  try {
    // Parse the URL-encoded query string
    const urlSearchParams = new URLSearchParams(initData);
    const data = Object.fromEntries(urlSearchParams.entries());
    
    // Recursively parse all values
    const parsedData = recursiveParseValues(data);
    
    return {
      success: true,
      data: parsedData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

module.exports = {
  validateInitDataUnsafe,
  validateWebTgAuthData,
  parseInitData
}
