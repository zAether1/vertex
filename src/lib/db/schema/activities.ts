import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const activityStatusEnum = pgEnum('activity_status', ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']);
export const missionStatusEnum = pgEnum('mission_status', ['LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'CLAIMED', 'EXPIRED']);
export const missionDefinitionStatusEnum = pgEnum('mission_definition_status', ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']);

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    reward: integer('reward').default(0).notNull(),
    maxCompletions: integer('max_completions'),
    maxPerUser: integer('max_per_user').default(1).notNull(),
    status: activityStatusEnum('status').default('DRAFT').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    requirements: text('requirements'),
    completionCount: integer('completion_count').default(0).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('activities_status_idx').on(table.status)
  })
);

export const activityCompletions = pgTable(
  'activity_completions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    activityId: uuid('activity_id').references(() => activities.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    transactionId: uuid('transaction_id'),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actUserIdx: uniqueIndex('act_comp_user_idx').on(table.activityId, table.userId)
  })
);

export const missions = pgTable(
  'missions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    reward: integer('reward').default(0).notNull(),
    targetValue: integer('target_value').default(1).notNull(),
    targetType: varchar('target_type', { length: 100 }).notNull(),
    status: missionDefinitionStatusEnum('status').default('DRAFT').notNull(),
    deadline: timestamp('deadline', { withTimezone: true }),
    requirements: text('requirements'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('missions_status_idx').on(table.status)
  })
);

export const missionProgress = pgTable(
  'mission_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    missionId: uuid('mission_id').references(() => missions.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    currentValue: integer('current_value').default(0).notNull(),
    status: missionStatusEnum('status').default('AVAILABLE').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    transactionId: uuid('transaction_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    missionUserIdx: uniqueIndex('mission_prog_user_idx').on(table.missionId, table.userId)
  })
);

export const achievements = pgTable(
  'achievements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    iconUrl: text('icon_url'),
    category: varchar('category', { length: 100 }),
    triggerType: varchar('trigger_type', { length: 100 }).notNull(),
    triggerValue: integer('trigger_value'),
    rarity: varchar('rarity', { length: 50 }).default('COMMON').notNull(),
    isHidden: boolean('is_hidden').default(false).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex('ach_name_idx').on(table.name)
  })
);

export const userAchievements = pgTable(
  'user_achievements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    achievementId: uuid('achievement_id').references(() => achievements.id, { onDelete: 'cascade' }).notNull(),
    awardedAt: timestamp('awarded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userAchIdx: uniqueIndex('user_ach_user_idx').on(table.userId, table.achievementId)
  })
);

export const activitiesRelations = relations(activities, ({ many, one }) => ({
  completions: many(activityCompletions),
  creator: one(users, { fields: [activities.createdBy], references: [users.id] }),
}));
export const activityCompletionsRelations = relations(activityCompletions, ({ one }) => ({
  activity: one(activities, { fields: [activityCompletions.activityId], references: [activities.id] }),
  user: one(users, { fields: [activityCompletions.userId], references: [users.id] }),
}));
export const missionsRelations = relations(missions, ({ many, one }) => ({
  progress: many(missionProgress),
  creator: one(users, { fields: [missions.createdBy], references: [users.id] }),
}));
export const missionProgressRelations = relations(missionProgress, ({ one }) => ({
  mission: one(missions, { fields: [missionProgress.missionId], references: [missions.id] }),
  user: one(users, { fields: [missionProgress.userId], references: [users.id] }),
}));
export const achievementsRelations = relations(achievements, ({ many, one }) => ({
  userAchievements: many(userAchievements),
  creator: one(users, { fields: [achievements.createdBy], references: [users.id] }),
}));
export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));
