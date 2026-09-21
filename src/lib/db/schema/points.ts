import { pgTable, uuid, integer, varchar, timestamp, pgEnum, jsonb, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

export const transactionTypeEnum = pgEnum('transaction_type', [
  'EARN', 'SPEND', 'ADMIN_GRANT', 'ADMIN_REMOVE', 'REWARD_REDEEM',
  'MISSION_REWARD', 'GAME_REWARD', 'GAME_LOSS', 'BONUS', 'REVERSAL',
  'ACTIVITY_REWARD', 'CODE_REDEEM'
]);

export const pointAccounts = pgTable(
  'point_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
    balance: integer('balance').default(0).notNull(),
    totalEarned: integer('total_earned').default(0).notNull(),
    totalSpent: integer('total_spent').default(0).notNull(),
    totalReceived: integer('total_received').default(0).notNull(),
    totalAdjusted: integer('total_adjusted').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    balanceCheck: check('balance_non_negative', sql`balance >= 0`)
  })
);

export const pointTransactions = pgTable(
  'point_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'restrict' }).notNull(),
    type: transactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),
    balanceBefore: integer('balance_before').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    reason: varchar('reason', { length: 500 }),
    referenceType: varchar('reference_type', { length: 100 }),
    referenceId: uuid('reference_id'),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).unique(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('point_txn_user_idx').on(table.userId)
  })
);

export const pointAccountsRelations = relations(pointAccounts, ({ one }) => ({
  user: one(users, { fields: [pointAccounts.userId], references: [users.id] }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, { fields: [pointTransactions.userId], references: [users.id] }),
  actor: one(users, { fields: [pointTransactions.actorId], references: [users.id] }),
}));


