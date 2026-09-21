/**
 * Vertex — Validation Schemas (Zod)
 *
 * Centralized validation for all user inputs.
 * Used in both API routes and server actions.
 *
 * SECURITY: ALL user input must pass through these schemas
 * before being processed. Never trust raw request data.
 */

import { z } from 'zod';
import { validation as t } from '@/lib/i18n/es';

/* ─── Auth ──────────────────────────────────────────────── */

export const loginSchema = z.object({
  email: z
    .string()
    .email(t.invalidEmail)
    .max(320, t.emailTooLong)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, t.passwordMin)
    .max(128, t.passwordMax),
});

export const registerSchema = z.object({
  email: z
    .string()
    .email(t.invalidEmail)
    .max(320, t.emailTooLong)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, t.passwordMin)
    .max(128, t.passwordMax)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      t.passwordRequirements
    ),
  username: z
    .string()
    .min(3, t.usernameMin)
    .max(30, t.usernameMax)
    .regex(/^[a-zA-Z0-9_]+$/, t.usernameChars),
  displayAlias: z.string().max(50, t.aliasTooLong).optional(),
});

/* ─── Profile ───────────────────────────────────────────── */

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, t.usernameMin)
    .max(30, t.usernameMax)
    .regex(/^[a-zA-Z0-9_]+$/, t.usernameChars)
    .optional(),
  displayAlias: z.string().max(50, t.aliasTooLong).optional(),
  bio: z.string().max(300, t.bioTooLong).optional(),
  avatarUrl: z.string().url(t.invalidUrl).max(500, t.urlTooLong).optional().nullable(),
});

/* ─── Points (Admin) ───────────────────────────────────── */

export const adminPointAdjustmentSchema = z.object({
  userId: z.string().uuid(t.invalidUserId),
  amount: z
    .number()
    .int(t.amountMustBeWhole)
    .refine((v) => v !== 0, t.amountCannotBeZero),
  reason: z
    .string()
    .min(3, t.reasonRequired)
    .max(500, t.reasonTooLong),
  type: z.enum(['ADMIN_GRANT', 'ADMIN_REMOVE']),
});

/* ─── Rewards ───────────────────────────────────────────── */

export const createRewardSchema = z.object({
  name: z.string().min(1, t.nameRequired).max(200, t.nameTooLong),
  description: z.string().max(2000, t.descTooLong).optional(),
  price: z.number().int().positive(t.priceMustBePositive),
  category: z.enum([
    'VIDEOGAMES', 'GIFT_CARDS', 'ACCOUNTS', 'PRODUCTS',
    'PLATFORM_PERKS', 'SPECIAL', 'PHYSICAL', 'DIGITAL',
  ]),
  stock: z.number().int().min(0, t.stockNegative).default(0),
  maxPerUser: z.number().int().min(1).default(1),
  requiresApproval: z.boolean().default(false),
  conditions: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

export const redeemRewardSchema = z.object({
  rewardId: z.string().uuid(t.invalidRewardId),
  idempotencyKey: z.string().min(1).max(128),
});

/* ─── Activities ────────────────────────────────────────── */

export const createActivitySchema = z.object({
  name: z.string().min(1, t.nameRequired).max(200, t.nameTooLong),
  description: z.string().max(2000).optional(),
  reward: z.number().int().min(0, t.rewardNegative),
  maxCompletions: z.number().int().positive().optional().nullable(),
  maxPerUser: z.number().int().min(1).default(1),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

/* ─── Missions ──────────────────────────────────────────── */

export const createMissionSchema = z.object({
  name: z.string().min(1, t.nameRequired).max(200, t.nameTooLong),
  description: z.string().max(2000).optional(),
  reward: z.number().int().min(0),
  targetValue: z.number().int().positive(t.targetMustBePositive),
  targetType: z.string().min(1).max(100),
  deadline: z.string().datetime().optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

/* ─── Achievements ──────────────────────────────────────── */

export const createAchievementSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  triggerType: z.string().min(1).max(100),
  triggerValue: z.number().int().optional().nullable(),
  rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']).default('COMMON'),
  isHidden: z.boolean().default(false),
  iconUrl: z.string().url().max(500).optional().nullable(),
  category: z.string().max(100).optional(),
});

/* ─── Games ─────────────────────────────────────────────── */

export const playGameSchema = z.object({
  gameId: z.string().uuid(t.invalidGameId),
  betAmount: z.number().int().positive(t.betMustBePositive),
  choice: z.union([z.string(), z.number()]).optional(),
});

/* ─── Admin User Management ─────────────────────────────── */

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid(t.invalidUserId),
  role: z.enum(['STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']),
});

export const updateUserStatusSchema = z.object({
  userId: z.string().uuid(t.invalidUserId),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING']),
  reason: z.string().max(500).optional(),
});

/* ─── Pagination & Filters ──────────────────────────────── */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
});
