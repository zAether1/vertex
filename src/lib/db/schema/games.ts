/**
 * Vertex — Database Schema: Games / Arcade
 *
 * Implements the virtual-points-only game system:
 * - games: game definitions (coin flip, dice, roulette, etc.)
 * - game_sessions: individual play records
 *
 * SECURITY:
 * - RNG happens ONLY on the server (crypto.randomInt)
 * - Results, bets, and payouts are all recorded immutably
 * - Client NEVER decides outcomes
 * - Configurable limits prevent abuse
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  jsonb,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

/* ─── Enums ─────────────────────────────────────────────── */

export const gameTypeEnum = pgEnum('game_type', [
  'COIN_FLIP',
  'DICE',
  'ROULETTE',
  'SLOTS',
  'CARDS',
  'SKILL',
]);

export const gameStatusEnum = pgEnum('game_status_type', [
  'ACTIVE',
  'PAUSED',
  'MAINTENANCE',
  'ARCHIVED',
]);

export const gameSessionResultEnum = pgEnum('game_session_result', [
  'WIN',
  'LOSS',
  'DRAW',
  'ERROR',
]);

/* ─── Games (Definitions) ──────────────────────────────── */

export const games = pgTable(
  'games',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    type: gameTypeEnum('type').notNull(),
    imageUrl: text('image_url'),
    status: gameStatusEnum('status').default('ACTIVE').notNull(),
    minBet: integer('min_bet').default(1).notNull(),
    maxBet: integer('max_bet').default(100).notNull(),
    maxPlaysPerDay: integer('max_plays_per_day').default(50).notNull(),
    maxPlaysPerHour: integer('max_plays_per_hour').default(20).notNull(),
    houseEdge: integer('house_edge').default(5).notNull(), // percentage (5 = 5%)
    payoutMultiplier: integer('payout_multiplier').default(190).notNull(), // 190 = 1.9x (stored as percentage * 100)
    rules: jsonb('rules'), // game-specific configuration
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({})
);

/* ─── Game Sessions ─────────────────────────────────────── */

export const gameSessions = pgTable(
  'game_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gameId: uuid('game_id')
      .references(() => games.id, { onDelete: 'restrict' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    betAmount: integer('bet_amount').notNull(),
    result: gameSessionResultEnum('result').notNull(),
    payout: integer('payout').default(0).notNull(), // points won (0 if loss)
    netResult: integer('net_result').notNull(), // payout - betAmount (negative = loss)
    serverSeed: varchar('server_seed', { length: 128 }).notNull(), // for provably fair verification
    resultData: jsonb('result_data'), // game-specific result details (dice value, card drawn, etc.)
    transactionId: uuid('transaction_id'), // linked point_transaction
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({})
);

/* ─── Relations ─────────────────────────────────────────── */

export const gamesRelations = relations(games, ({ many }) => ({
  sessions: many(gameSessions),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  game: one(games, {
    fields: [gameSessions.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [gameSessions.userId],
    references: [users.id],
  }),
}));
