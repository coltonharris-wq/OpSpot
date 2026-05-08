import crypto from 'crypto';

export type ConnectionCredentials = Record<string, string>;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Missing ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY');
  }

  return crypto.createHash('sha256').update(key).digest();
}

export function encryptCredentials(credentials: ConnectionCredentials): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);

  let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted,
    tag: cipher.getAuthTag().toString('hex'),
  });
}

export function decryptCredentials(payload: string | null | undefined): ConnectionCredentials | null {
  if (!payload) return null;

  const parsed = JSON.parse(payload) as { iv: string; data: string; tag: string };
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(parsed.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(parsed.tag, 'hex'));

  let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted) as ConnectionCredentials;
}
