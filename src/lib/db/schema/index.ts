/**
 * Vertex — Database Schema: Barrel Export
 *
 * All schema modules are re-exported from here.
 * Drizzle Kit uses this file as the single entry point for migrations.
 */

// Identity & Auth
export * from './users';

// Point Economy
export * from './points';

// Rewards & Marketplace
export * from './rewards';

// Activities, Missions & Achievements
export * from './activities';

// Games / Arcade
export * from './games';

// Audit & Security
export * from './audit';
