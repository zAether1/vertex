import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import { users, pointAccounts, pointTransactions, rewards, rewardInventory, redemptions } from '@/lib/db/schema';
import { executePointOperation } from '@/lib/services/points';
import { redeemReward } from '@/lib/services/redemptions';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const hasTestDb = !!process.env.DATABASE_URL_TEST;

describe.skipIf(!hasTestDb)('PostgreSQL Concurrency Integration Tests', () => {
  let testUserId = 'test-user-postgres-1';
  
  beforeAll(async () => {
    if (!hasTestDb) return;
    await db.delete(redemptions).where(eq(redemptions.userId, testUserId));
    await db.delete(pointTransactions).where(eq(pointTransactions.userId, testUserId));
    await db.delete(pointAccounts).where(eq(pointAccounts.userId, testUserId));
    await db.delete(rewardInventory).where(eq(rewardInventory.redeemedBy, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    
    await db.insert(users).values({
      id: testUserId,
      realName: 'Integration Test User',
      email: 'testpostgres@example.com',
      role: 'STUDENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterAll(async () => {
    if (!hasTestDb) return;
    await db.delete(redemptions).where(eq(redemptions.userId, testUserId));
    await db.delete(pointTransactions).where(eq(pointTransactions.userId, testUserId));
    await db.delete(pointAccounts).where(eq(pointAccounts.userId, testUserId));
    await db.delete(rewardInventory).where(eq(rewardInventory.redeemedBy, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('1. IDEMPOTENCIA REAL Y DOUBLE SPEND (Misma idempotencyKey simultanea)', async () => {
    const rewardId = randomUUID();
    const idemKey = 'idem-test-' + Date.now().toString();

    await db.insert(rewards).values({
      id: rewardId,
      name: 'Idempotency Test Reward',
      description: 'Desc',
      price: 100,
      stock: 10,
      status: 'ACTIVE',
      category: 'DIGITAL',
      requiresApproval: false,
      hasPrivatePayload: false,
      maxPerUser: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(pointAccounts).values({
      userId: testUserId,
      balance: 150,
      totalEarned: 150,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const p1 = redeemReward({ userId: testUserId, rewardId, idempotencyKey: idemKey });
    const p2 = redeemReward({ userId: testUserId, rewardId, idempotencyKey: idemKey });
    
    const [res1, res2] = await Promise.all([p1, p2]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res1.redemptionId).toBe(res2.redemptionId);

    const [account] = await db.select().from(pointAccounts).where(eq(pointAccounts.userId, testUserId));
    expect(account.balance).toBe(50);

    const txs = await db.select().from(pointTransactions).where(eq(pointTransactions.idempotencyKey, 'redeem_tx_' + idemKey));
    expect(txs.length).toBe(1);

    const reds = await db.select().from(redemptions).where(eq(redemptions.idempotencyKey, idemKey));
    expect(reds.length).toBe(1);

    await db.delete(redemptions).where(eq(redemptions.rewardId, rewardId));
    await db.delete(rewards).where(eq(rewards.id, rewardId));
  });

  it('2. DOUBLE SPEND REAL Y CONCURRENCIA DE STOCK (Keys distintas, saldo justo, inventario=1)', async () => {
    const rewardId = randomUUID();
    
    await db.insert(rewards).values({
      id: rewardId,
      name: 'Inventory Concurrency Reward',
      description: 'Desc',
      price: 50,
      stock: 1,
      status: 'ACTIVE',
      category: 'DIGITAL',
      requiresApproval: false,
      hasPrivatePayload: true,
      maxPerUser: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const inventoryId = randomUUID();
    await db.insert(rewardInventory).values({
      id: inventoryId,
      rewardId,
      encryptedPayload: 'SECRET_PAYLOAD_E2E',
      isRedeemed: false,
      createdAt: new Date(),
          });

    await db.update(pointAccounts).set({ balance: 50, totalEarned: 50, totalSpent: 0 }).where(eq(pointAccounts.userId, testUserId));

    const key1 = 'stock-test-1-' + Date.now().toString();
    const key2 = 'stock-test-2-' + Date.now().toString();

    const p1 = redeemReward({ userId: testUserId, rewardId, idempotencyKey: key1 });
    const p2 = redeemReward({ userId: testUserId, rewardId, idempotencyKey: key2 });

    const [res1, res2] = await Promise.all([p1, p2]);

    const successes = [res1, res2].filter(r => r.success);
    const failures = [res1, res2].filter(r => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    const [account] = await db.select().from(pointAccounts).where(eq(pointAccounts.userId, testUserId));
    expect(account.balance).toBe(0);

    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    expect(reward.stock).toBe(0);
    expect(reward.status).toBe('SOLD_OUT');

    const consumedInventory = await db.select().from(rewardInventory).where(eq(rewardInventory.rewardId, rewardId));
    expect(consumedInventory.length).toBe(1);
    expect(consumedInventory[0].isRedeemed).toBe(true);
    expect(consumedInventory[0].redeemedBy).toBe(testUserId);

    await db.delete(redemptions).where(eq(redemptions.rewardId, rewardId));
    await db.delete(rewardInventory).where(eq(rewardInventory.rewardId, rewardId));
    await db.delete(rewards).where(eq(rewards.id, rewardId));
  });
});