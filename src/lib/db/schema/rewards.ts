import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const rewardCategoryEnum = pgEnum('reward_category', ['VIDEOGAMES', 'GIFT_CARDS', 'ACCOUNTS', 'PRODUCTS', 'PLATFORM_PERKS', 'SPECIAL', 'PHYSICAL', 'DIGITAL']);
export const rewardStatusEnum = pgEnum('reward_status', ['DRAFT', 'ACTIVE', 'PAUSED', 'SOLD_OUT', 'ARCHIVED']);
export const redemptionStatusEnum = pgEnum('redemption_status', ['PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED', 'EXPIRED']);

export const rewards = pgTable(
  'rewards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    price: integer('price').notNull(),
    category: rewardCategoryEnum('category').notNull(),
    status: rewardStatusEnum('status').default('DRAFT').notNull(),
    stock: integer('stock').default(0).notNull(),
    totalStock: integer('total_stock').default(0).notNull(),
    maxPerUser: integer('max_per_user').default(1).notNull(),
    requiresApproval: boolean('requires_approval').default(false).notNull(),
    hasPrivatePayload: boolean('has_private_payload').default(false).notNull(),
    conditions: text('conditions'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('rewards_status_idx').on(table.status),
    categoryIdx: index('rewards_cat_idx').on(table.category)
  })
);

export const rewardInventory = pgTable(
  'reward_inventory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    rewardId: uuid('reward_id').references(() => rewards.id, { onDelete: 'cascade' }).notNull(),
    encryptedPayload: text('encrypted_payload'),
    isRedeemed: boolean('is_redeemed').default(false).notNull(),
    redeemedBy: uuid('redeemed_by').references(() => users.id, { onDelete: 'set null' }),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    rewardIdx: index('rew_inv_reward_idx').on(table.rewardId),
    redeemerIdx: index('rew_inv_redeemer_idx').on(table.redeemedBy)
  })
);

export const redemptions = pgTable(
  'redemptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'restrict' }).notNull(),
    rewardId: uuid('reward_id').references(() => rewards.id, { onDelete: 'restrict' }).notNull(),
    inventoryItemId: uuid('inventory_item_id').references(() => rewardInventory.id, { onDelete: 'set null' }),
    transactionId: uuid('transaction_id'),
    pointsSpent: integer('points_spent').notNull(),
    status: redemptionStatusEnum('status').default('PENDING').notNull(),
    fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelReason: text('cancel_reason'),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('redemp_user_idx').on(table.userId),
    statusIdx: index('redemp_status_idx').on(table.status)
  })
);

export const rewardsRelations = relations(rewards, ({ many, one }) => ({
  inventory: many(rewardInventory),
  redemptions: many(redemptions),
  creator: one(users, { fields: [rewards.createdBy], references: [users.id] }),
}));

export const rewardInventoryRelations = relations(rewardInventory, ({ one }) => ({
  reward: one(rewards, { fields: [rewardInventory.rewardId], references: [rewards.id] }),
  redeemer: one(users, { fields: [rewardInventory.redeemedBy], references: [users.id] }),
}));

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  user: one(users, { fields: [redemptions.userId], references: [users.id] }),
  reward: one(rewards, { fields: [redemptions.rewardId], references: [rewards.id] }),
  inventoryItem: one(rewardInventory, { fields: [redemptions.inventoryItemId], references: [rewardInventory.id] }),
}));
