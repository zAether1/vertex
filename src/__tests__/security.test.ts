import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt } from '@/lib/security';
import { randomBytes, createCipheriv } from 'crypto';

describe('AES-256-GCM Security Tests', () => {
  beforeAll(() => {
    process.env.VERTEX_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('1. encrypt and decrypt roundtrip', () => {
    const plaintext = 'MY_SUPER_SECRET_PAYLOAD_123';
    const ciphertext = encrypt(plaintext);
    
    const parts = ciphertext.split(':');
    expect(parts.length).toBe(3);
    
    // Check IV length: 12 bytes = 24 hex characters
    expect(parts[0].length).toBe(24);
    
    // Check Auth Tag length: 16 bytes = 32 hex characters
    expect(parts[1].length).toBe(32);

    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it('2. decrypt backwards compatibility with 16-byte IV', () => {
    const key = Buffer.from(process.env.VERTEX_ENCRYPTION_KEY || '', 'hex');
    const iv16 = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv16);
    const plaintext = 'OLD_16_BYTE_IV_PAYLOAD';
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    const legacyPayload = iv16.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    
    const decrypted = decrypt(legacyPayload);
    expect(decrypted).toBe(plaintext);
  });

  it('3. tamper ciphertext', () => {
    const ciphertext = encrypt('HELLO_WORLD');
    const parts = ciphertext.split(':');
    
    let badCiphertext = parts[2];
    const lastChar = badCiphertext[badCiphertext.length - 1];
    badCiphertext = badCiphertext.slice(0, -1) + (lastChar === 'a' ? 'b' : 'a');
    
    const tamperedPayload = parts[0] + ':' + parts[1] + ':' + badCiphertext;
    
    expect(() => decrypt(tamperedPayload)).toThrow(/Unsupported state or unable to authenticate data/);
  });

  it('4. tamper authTag', () => {
    const ciphertext = encrypt('HELLO_WORLD');
    const parts = ciphertext.split(':');
    
    let badTag = parts[1];
    const lastChar = badTag[badTag.length - 1];
    badTag = badTag.slice(0, -1) + (lastChar === 'a' ? 'b' : 'a');
    
    const tamperedPayload = parts[0] + ':' + badTag + ':' + parts[2];
    
    expect(() => decrypt(tamperedPayload)).toThrow(/Unsupported state or unable to authenticate data/);
  });

  it('5. unique IV generation', () => {
    const pt = 'SAME_PLAINTEXT';
    const c1 = encrypt(pt);
    const c2 = encrypt(pt);
    
    expect(c1.split(':')[0]).not.toBe(c2.split(':')[0]);
    expect(c1.split(':')[2]).not.toBe(c2.split(':')[2]);
  });
  it('6. key validation - less than 64 chars', () => {
    process.env.VERTEX_ENCRYPTION_KEY = 'a'.repeat(63);
    expect(() => encrypt('HELLO')).toThrow(/must be a 64-character hex string/);
  });

  it('7. key validation - more than 64 chars', () => {
    process.env.VERTEX_ENCRYPTION_KEY = 'a'.repeat(65);
    expect(() => encrypt('HELLO')).toThrow(/must be a 64-character hex string/);
  });

  it('8. key validation - invalid hex characters', () => {
    process.env.VERTEX_ENCRYPTION_KEY = 'z'.repeat(64);
    expect(() => encrypt('HELLO')).toThrow(/must be a 64-character hex string/);
  });

  it('9. key validation - missing key', () => {
    delete process.env.VERTEX_ENCRYPTION_KEY;
    expect(() => encrypt('HELLO')).toThrow(/must be a 64-character hex string/);
  });

  it('10. key validation - valid 64 hex', () => {
    process.env.VERTEX_ENCRYPTION_KEY = '1234567890abcdef1234567890ABCDEF1234567890abcdef1234567890ABCDEF';
    expect(() => encrypt('HELLO')).not.toThrow();
  });
});