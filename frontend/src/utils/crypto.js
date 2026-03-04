// frontend/src/utils/crypto.js

const toBase64 = (buff) => btoa(String.fromCharCode(...new Uint8Array(buff)));
const toBuffer = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

// --- 1. PKI: KEY MANAGEMENT (RSA-PSS) ---
export const generateKeyPair = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );
};

export const exportKey = async (key) => {
  const exported = await window.crypto.subtle.exportKey(
    key.type === "private" ? "pkcs8" : "spki",
    key
  );
  return toBase64(exported);
};

export const importKey = async (keyB64, type) => {
  const buff = toBuffer(keyB64);
  return await window.crypto.subtle.importKey(
    type === "private" ? "pkcs8" : "spki",
    buff,
    { name: "RSA-PSS", hash: "SHA-256" },
    true,
    type === "private" ? ["sign"] : ["verify"]
  );
};

// --- 2. DIGITAL SIGNATURES ---
export const signData = async (text, privateKey) => {
  const enc = new TextEncoder();
  const signature = await window.crypto.subtle.sign(
    { name: "RSA-PSS", saltLength: 32 },
    privateKey,
    enc.encode(text)
  );
  return toBase64(signature);
};

export const verifySignature = async (text, signatureB64, publicKey) => {
  try {
    const enc = new TextEncoder();
    const signature = toBuffer(signatureB64);
    return await window.crypto.subtle.verify(
      { name: "RSA-PSS", saltLength: 32 },
      publicKey,
      signature,
      enc.encode(text)
    );
  } catch (e) {
    return false;
  }
};

// --- 3. HYBRID ENCRYPTION (AES-GCM + PBKDF2) ---
export const deriveKey = async (password, saltBuffer) => {
  const enc = new TextEncoder();
  const salt = saltBuffer || window.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  const key = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, ["encrypt", "decrypt"]
  );
  return { key, salt };
};

export const encryptData = async (text, password) => {
  const { key, salt } = await deriveKey(password);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, 
    key, 
    new TextEncoder().encode(text)
  );
  
  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    salt: toBase64(salt)
  };
};

export const decryptData = async (encryptedObj, password) => {
  try {
    const salt = toBuffer(encryptedObj.salt);
    const iv = toBuffer(encryptedObj.iv);
    const ciphertext = toBuffer(encryptedObj.ciphertext);
    const { key } = await deriveKey(password, salt);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv }, 
      key, 
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    throw new Error("Decryption Failed");
  }
};