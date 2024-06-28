const crypto = require("crypto");

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

module.exports = {
  validateInitDataUnsafe,
  validateWebTgAuthData
}
