/**
 * Vertex — Audit Service
 *
 * Centralized logging for all business-critical and security events.
 * All sensitive operations must call this service to create an audit trail.
 *
 * CRITICAL RULES:
 * - NEVER log passwords, tokens, session cookies, or encrypted payloads.
 * - IP addresses are anonymized before storage.
 * - This is append-only — logs should never be deleted in production.
 */

import { db } from '@/lib/db';
import { auditLogs, securityEvents, type auditActionEnum, type securityEventTypeEnum, type severityEnum } from '@/lib/db/schema';
import { anonymizeIp } from '@/lib/security';

/* ─── Types ─────────────────────────────────────────────── */

type AuditAction = (typeof auditActionEnum.enumValues)[number];
type SecurityEventType = (typeof securityEventTypeEnum.enumValues)[number];
type Severity = (typeof severityEnum.enumValues)[number];

export interface AuditLogInput {
  action: AuditAction;
  severity?: Severity;
  actorId?: string | null;
  targetId?: string;
  targetType?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface SecurityEventInput {
  eventType: SecurityEventType;
  severity?: Severity;
  actorId?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/* ─── Audit Log ─────────────────────────────────────────── */

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action: input.action,
      severity: input.severity || 'INFO',
      actorId: input.actorId,
      targetId: input.targetId,
      targetType: input.targetType,
      description: input.description,
      metadata: sanitizeMetadata(input.metadata),
      ipAddress: anonymizeIp(input.ipAddress),
      userAgent: input.userAgent?.substring(0, 500) || null,
    });
  } catch (error) {
    // Audit logging should never crash the application
    console.error('[AuditService] Failed to create audit log:', error);
  }
}

/* ─── Security Event ────────────────────────────────────── */

export async function createSecurityEvent(input: SecurityEventInput): Promise<void> {
  try {
    await db.insert(securityEvents).values({
      eventType: input.eventType,
      severity: input.severity || 'WARNING',
      actorId: input.actorId,
      description: input.description,
      metadata: sanitizeMetadata(input.metadata),
      ipAddress: anonymizeIp(input.ipAddress),
      userAgent: input.userAgent?.substring(0, 500) || null,
    });
  } catch (error) {
    console.error('[AuditService] Failed to create security event:', error);
  }
}

/* ─── Metadata Sanitization ─────────────────────────────── */

/**
 * Removes any potentially sensitive fields from metadata before logging.
 * Defense-in-depth: even if a caller accidentally includes a password,
 * this function strips it.
 */
function sanitizeMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const sensitiveKeys = [
    'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
    'secret', 'sessionToken', 'cookie', 'authorization', 'apiKey',
    'encryptedPayload', 'credential', 'privateKey', 'oauthToken',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
