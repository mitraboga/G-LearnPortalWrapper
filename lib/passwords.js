const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

async function hashPassword(password) {
  const normalizedPassword = String(password || "");

  if (!normalizedPassword) {
    throw new Error("Password is required.");
  }

  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = await scrypt(normalizedPassword, salt, KEY_LENGTH);

  return `${HASH_PREFIX}$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }

  const [prefix, salt, expectedHash] = String(storedHash).split("$");

  if (prefix !== HASH_PREFIX || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = await scrypt(String(password || ""), salt, KEY_LENGTH);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (expectedBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, derivedKey);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
