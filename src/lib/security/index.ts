/**
 * Vertex — Security Utilities
 *
 * Core security functions used across the platform:
 * - Password hashing (bcrypt)
 * - Encryption for reward secrets (AES-256-GCM)
 * - IP anonymization
 * - Idempotency key generation
 * - Rate limiting (distributed via Upstash Redis, fallback to in-memory for dev)
 * - CSRF token generation
 *
 * CRITICAL: This module runs SERVER-SIDE ONLY.
 * None of these functions should ever be imported in client components.
 */

import { randomBytes, createCipheriv, createDecipheriv, randomInt } from 'crypto';
import bcrypt from 'bcryptjs';

/* ─── Password Hashing ──────────────────────────────────── */

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ─── AES-256-GCM Encryption (for reward secrets) ───────── */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.VERTEX_ENCRYPTION_KEY;
  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('VERTEX_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
  }
  return Buffer.from(key, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedPayload: string): string {
  const key = getEncryptionKey();
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format.');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const ciphertext = parts[2];

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/* ─── IP Anonymization ──────────────────────────────────── */

export function anonymizeIp(ip: string | null | undefined): string | null {
  if (!ip) return null;

  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  } else if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts.slice(0, 3).join(':')}:xxxx:xxxx:xxxx:xxxx:xxxx`;
    }
  }

  return null;
}

/* ─── Idempotency Keys ──────────────────────────────────── */

export function generateIdempotencyKey(): string {
  return randomBytes(16).toString('hex');
}

/* ─── CSRF Token ────────────────────────────────────────── */

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/* ─── Secure Random Integer (for games) ─────────────────── */

export function secureRandomInt(min: number, max: number): number {
  return randomInt(min, max);
}

/* ─── Server Seed (for provably fair games) ─────────────── */

export function generateServerSeed(): string {
  return randomBytes(32).toString('hex');
}

/* ─── Input Sanitization ────────────────────────────────── */

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ─── Rate Limiting (Distributed / Serverless Compatible) ─ */

/**
 * Rate limiting strategy:
 *
 * PRODUCTION (Vercel): Uses Upstash Redis REST API for distributed
 *   rate limiting across serverless instances. Requires:
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 *
 * DEVELOPMENT: Uses in-memory Map (single process, acceptable for dev).
 *
 * FALLBACK: If Redis is not configured in production, rate limiting
 *   is STRICT — it blocks requests rather than allowing unlimited access.
 *   This prevents accidentally disabling security.
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// In-memory store for development only
const devStore = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimitRedis(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // In production without Redis: BLOCK to be safe (fail-closed)
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SECURITY] Rate limiting Redis not configured. Blocking request as fail-closed.');
      return { allowed: false, remaining: 0, resetAt: Date.now() + windowMs };
    }
    // In development: use in-memory fallback
    return checkRateLimitMemory(identifier, maxRequests, windowMs);
  }

  try {
    const key = `rl:${identifier}`;
    const windowSec = Math.ceil(windowMs / 1000);

    // INCR + EXPIRE in a pipeline via Upstash REST
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec.toString()],
        ['TTL', key],
      ]),
    });

    if (!res.ok) {
      console.error('[SECURITY] Upstash Redis error:', res.status);
      // On Redis error in production: fail-closed
      return { allowed: false, remaining: 0, resetAt: Date.now() + windowMs };
    }

    const results = await res.json();
    const count = results[0]?.result ?? 1;
    const ttl = results[2]?.result ?? windowSec;

    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    const resetAt = Date.now() + (ttl * 1000);

    return { allowed, remaining, resetAt };
  } catch (err) {
    console.error('[SECURITY] Rate limit check failed:', err);
    // Fail-closed on errors
    return { allowed: false, remaining: 0, resetAt: Date.now() + windowMs };
  }
}

function checkRateLimitMemory(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = devStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    devStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Check rate limit for a given identifier.
 * Automatically uses Redis in production or memory in development.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  // Use Redis when available (production), memory for dev
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return checkRateLimitRedis(identifier, maxRequests, windowMs);
  }

  if (process.env.NODE_ENV === 'production') {
    // Production without Redis: fail-closed
    console.warn('[SECURITY] No rate limit store configured in production. Blocking request.');
    return { allowed: false, remaining: 0, resetAt: Date.now() + windowMs };
  }

  return checkRateLimitMemory(identifier, maxRequests, windowMs);
}
