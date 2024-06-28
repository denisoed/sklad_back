const crypto = require("crypto");
const sha256 = require("crypto-js/sha256");
const hmacSHA256 = require("crypto-js/hmac-sha256");
const Hex = require("crypto-js/enc-hex");

function validateInitDataUnsafe(initDataUnsafe) {
  const initData = { ...initDataUnsafe };
  const hash = initData.hash;
  delete initData.hash;
  const dataToCheck = Object.keys(initData)
      .map(key => {
        if (typeof initData[key] === "object") {
          return `${key}=${JSON.stringify(initData[key])}`;
        }
        return `${key}=${initData[key]}`
      })
      .sort()
      .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData")
    .update(process.env.TELEGRAM_BOT_KEY)
    .digest();
  const _hash = crypto.createHmac("sha256", secretKey).update(dataToCheck).digest("hex");
  return hash === _hash;
}

function validateWebTgAuthData(data) {
  const verificationData = { ...data };
  delete verificationData.hash;

  const message = Object.keys(verificationData)
    .map(key => `${key}=${verificationData[key]}`)
    .sort()
    .join("\n");
  const secretKey = sha256(process.env.TELEGRAM_BOT_KEY);
  const hash = Hex.stringify(hmacSHA256(message, secretKey));
  return hash === data.hash;
}

module.exports = {
  validateInitDataUnsafe,
  validateWebTgAuthData
}
