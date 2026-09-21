/**
 * Vertex — Database Schema: Audit Logs & Security Events
 *
 * Immutable logging for all sensitive operations:
 * - audit_logs: business-level events (point changes, redemptions, admin actions)
 * - security_events: security-level events (failed logins, permission violations, suspicious behavior)
 *
 * CRITICAL:
 * - NEVER log passwords, tokens, session cookies, encryption keys, or reward credentials.
 * - IP addresses are stored partially anonymized (last octet masked).
 * - These tables are append-only in production.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/* ─── Enums ─────────────────────────────────────────────── */

export const auditActionEnum = pgEnum('audit_action', [
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_REGISTER',
  'USER_UPDATE',
  'USER_SUSPEND',
  'USER_ACTIVATE',
  'USER_DELETE',
  'PASSWORD_CHANGE',
  'ROLE_CHANGE',
  'PERMISSION_CHANGE',
  'POINTS_GRANT',
  'POINTS_REMOVE',
  'POINTS_EARN',
  'POINTS_SPEND',
  'REWARD_CREATE',
  'REWARD_UPDATE',
  'REWARD_DELETE',
  'REDEMPTION_CREATE',
  'REDEMPTION_APPROVE',
  'REDEMPTION_FULFIL',
  'REDEMPTION_CANCEL',
  'ACTIVITY_CREATE',
  'ACTIVITY_UPDATE',
  'ACTIVITY_COMPLETE',
  'MISSION_CREATE',
  'MISSION_UPDATE',
  'MISSION_CLAIM',
  'ACHIEVEMENT_AWARD',
  'GAME_PLAY',
  'SESSION_REVOKE',
  'CONFIG_CHANGE',
  'SYSTEM_EVENT',
]);

export const severityEnum = pgEnum('severity_level', [
  'INFO',
  'WARNING',
  'ERROR',
  'CRITICAL',
]);

export const securityEventTypeEnum = pgEnum('security_event_type', [
  'FAILED_LOGIN',
  'ACCOUNT_LOCKED',
  'INVALID_TOKEN',
  'PERMISSION_DENIED',
  'RATE_LIMIT_HIT',
  'SUSPICIOUS_ACTIVITY',
  'CSRF_VIOLATION',
  'INVALID_INPUT',
  'REPLAY_ATTEMPT',
  'DUPLICATE_REQUEST',
  'UNAUTHORIZED_ACCESS',
  'BRUTE_FORCE_DETECTED',
  'SESSION_ANOMALY',
  'DATA_INTEGRITY_ERROR',
]);

/* ─── Audit Logs ────────────────────────────────────────── */

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    action: auditActionEnum('action').notNull(),
    severity: severityEnum('severity').default('INFO').notNull(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }), // who performed the action
    targetId: uuid('target_id'), // affected entity (user, reward, etc.)
    targetType: varchar('target_type', { length: 100 }), // 'user', 'reward', 'redemption', etc.
    description: text('description'),
    // Metadata — NEVER include secrets, passwords, tokens, or credentials here
    metadata: jsonb('metadata'),
    ipAddress: varchar('ip_address', { length: 45 }), // partially anonymized
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({})
);

/* ─── Security Events ──────────────────────────────────── */

export const securityEvents = pgTable(
  'security_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventType: securityEventTypeEnum('event_type').notNull(),
    severity: severityEnum('severity').default('WARNING').notNull(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    description: text('description'),
    metadata: jsonb('metadata'), // NEVER include secrets
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    resolved: timestamp('resolved', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({})
);
