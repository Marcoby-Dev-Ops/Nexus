import { Buffer } from 'https://deno.land/std@0.177.0/node/buffer.ts';

const ALGORITHM = 'AES-GCM';
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt'];

let cryptoKey: CryptoKey | undefined;

/**
 * Imports the encryption key from environment variables.
 * This is the master key used for all credential encryption.
 * It must be a 32-byte (256-bit) key, base64-encoded.
 */
async function importKey(): Promise<CryptoKey> {
  if (cryptoKey) {
    return cryptoKey;
  }

  const keyBase64 = Deno.env.get('NEXUS_ENCRYPTION_KEY');
  if (!keyBase64) {
    throw new Error('NEXUS_ENCRYPTION_KEY environment variable not set.');
  }

  try {
    const keyBytes = Buffer.from(keyBase64, 'base64');
    if (keyBytes.length !== 32) {
      throw new Error('Decoded NEXUS_ENCRYPTION_KEY must be 32 bytes.');
    }
    
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: ALGORITHM },
      false,
      KEY_USAGE
    );
    return cryptoKey;
  } catch (e) {
    console.error('Failed to import encryption key:', e.message);
    throw new Error('Invalid NEXUS_ENCRYPTION_KEY.');
  }
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param plaintext The string to encrypt.
 * @returns An object containing the ciphertext, iv, and authTag.
 */
export async function encrypt(plaintext: string): Promise<{
  ciphertext: string;
  iv: string;
  authTag: string;
}> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
  const encoder = new TextEncoder();
  const encodedPlaintext = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv },
    key,
    encodedPlaintext
  );
  
  // The result of encryption is an ArrayBuffer containing the ciphertext and authTag concatenated.
  // GCM adds a 16-byte (128-bit) authTag at the end.
  const ciphertextBytes = encrypted.slice(0, encrypted.byteLength - 16);
  const authTagBytes = encrypted.slice(encrypted.byteLength - 16);

  return {
    ciphertext: Buffer.from(ciphertextBytes).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    authTag: Buffer.from(authTagBytes).toString('base64'),
  };
}

/**
 * Decrypts a ciphertext string using AES-256-GCM.
 * @param ciphertext The base64-encoded ciphertext.
 * @param iv The base64-encoded initialization vector.
 * @param authTag The base64-encoded GCM authentication tag.
 * @returns The decrypted plaintext string.
 */
export async function decrypt(ciphertext: string, iv: string, authTag: string): Promise<string> {
  const key = await importKey();
  
  try {
    const ivBytes = Buffer.from(iv, 'base64');
    const ciphertextBytes = Buffer.from(ciphertext, 'base64');
    const authTagBytes = Buffer.from(authTag, 'base64');

    // Concatenate ciphertext and authTag as expected by crypto.subtle.decrypt
    const fullEncryptedData = new Uint8Array([...ciphertextBytes, ...authTagBytes]);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: ivBytes },
      key,
      fullEncryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    // Do not leak specific error details.
    throw new Error("Failed to decrypt credential.");
  }
} 