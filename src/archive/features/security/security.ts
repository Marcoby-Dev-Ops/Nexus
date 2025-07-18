import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-encryption-key-min-32-chars';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export async function encrypt(text: string): Promise<string> {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export async function decrypt(encryptedData: string): Promise<string> {
  const buffer = Buffer.from(encryptedData, 'base64');

  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final('utf8');
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
} 