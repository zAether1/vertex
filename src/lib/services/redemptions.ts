/**
 * Vertex Ã¢â‚¬â€ Redemption Service
 *
 * Handles the full reward redemption flow:
 * 1. Verify balance
 * 2. Check stock availability
 * 3. Lock reward row (SELECT FOR UPDATE)
 * 4. Deduct points atomically
 * 5. Reduce stock
 * 6. Assign inventory item (if applicable)
 * 7. Create redemption record
 * 8. Audit log
 *
 * SECURITY:
 * - Entire flow runs in a single PostgreSQL transaction
 * - Row-level locks prevent race conditions on stock
 * - Idempotency keys prevent double redemption
 * - Price comes from the database, NEVER from client
 */

import { db } from '@/lib/db';
import { rewards, rewardInventory, redemptions, pointAccounts, pointTransactions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { executePointOperation } from './points';
import { createAuditLog } from './audit';
import { generateIdempotencyKey } from '@/lib/security';

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Types Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

export interface RedeemInput {
  userId: string;
  rewardId: string;
  idempotencyKey: string;
}

export interface RedeemResult {
  success: boolean;
  redemptionId?: string;
  error?: string;
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Redeem Reward Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

export async function redeemReward(input: RedeemInput): Promise<RedeemResult> {
  try {
    const result = await db.transaction(async (tx) => {
      // 1. Check idempotency
      const existing = await tx.query.redemptions.findFirst({
        where: eq(redemptions.idempotencyKey, input.idempotencyKey),
      });

      if (existing) {
        if (existing.userId !== input.userId) {
          throw new Error('IDEMPOTENCY_KEY_MISMATCH');
        }
        return { success: true, redemptionId: existing.id };
      }

      // 2. Lock the reward row and get current data
      const [reward] = await tx
        .select()
        .from(rewards)
        .where(eq(rewards.id, input.rewardId))
        .for('update');

      if (!reward) {
        throw new Error('REWARD_NOT_FOUND');
      }

      if (reward.status !== 'ACTIVE') {
        throw new Error('REWARD_NOT_AVAILABLE');
      }

      if (reward.stock <= 0) {
        throw new Error('REWARD_OUT_OF_STOCK');
      }

      // Check date constraints
      const now = new Date();
      if (reward.startDate && now < reward.startDate) {
        throw new Error('REWARD_NOT_AVAILABLE_YET');
      }
      if (reward.endDate && now > reward.endDate) {
        throw new Error('REWARD_EXPIRED');
      }

      // 3. Check max per user
      const userRedemptionCount = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(redemptions)
        .where(
          and(
            eq(redemptions.userId, input.userId),
            eq(redemptions.rewardId, input.rewardId),
            sql`${redemptions.status} != 'CANCELLED'`
          )
        );

      if ((userRedemptionCount[0]?.count ?? 0) >= reward.maxPerUser) {
        throw new Error('MAX_REDEMPTIONS_REACHED');
      }

      // 4. Lock user's point account and check balance
      const [account] = await tx
        .select()
        .from(pointAccounts)
        .where(eq(pointAccounts.userId, input.userId))
        .for('update');

      if (!account || account.balance < reward.price) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // 5. Deduct points via unified PointEconomyService (passing the same transaction tx)
      const pointOp = await executePointOperation(
        {
          userId: input.userId,
          type: 'REWARD_REDEEM',
          amount: -reward.price,
          reason: `Redeemed: ${reward.name}`,
          referenceType: 'reward',
          referenceId: reward.id,
          idempotencyKey: `redeem_tx_${input.idempotencyKey}`,
        },
        tx
      );
      if (!pointOp.success || !pointOp.transaction) {
        throw new Error('INSUFFICIENT_BALANCE');
      }
      const transaction = pointOp.transaction;

      // 7. Reduce stock
      await tx
        .update(rewards)
        .set({
          stock: reward.stock - 1,
          status: reward.stock - 1 <= 0 ? 'SOLD_OUT' : reward.status,
          updatedAt: new Date(),
        })
        .where(eq(rewards.id, input.rewardId));

      // 8. Assign inventory item (if reward has private payloads)
      let inventoryItemId: string | null = null;
      if (reward.hasPrivatePayload) {
        const [inventoryItem] = await tx
          .select()
          .from(rewardInventory)
          .where(
            and(
              eq(rewardInventory.rewardId, input.rewardId),
              eq(rewardInventory.isRedeemed, false)
            )
          )
          .limit(1)
          .for('update');

        if (inventoryItem) {
          await tx
            .update(rewardInventory)
            .set({
              isRedeemed: true,
              redeemedBy: input.userId,
              redeemedAt: new Date(),
            })
            .where(eq(rewardInventory.id, inventoryItem.id));

          inventoryItemId = inventoryItem.id;
        }
      }

      // 9. Create redemption record
      const status = reward.requiresApproval ? 'PENDING' : 'FULFILLED';
      const [redemption] = await tx
        .insert(redemptions)
        .values({
          userId: input.userId,
          rewardId: input.rewardId,
          inventoryItemId,
          transactionId: transaction.id,
          pointsSpent: reward.price,
          status,
          fulfilledAt: status === 'FULFILLED' ? new Date() : null,
          idempotencyKey: input.idempotencyKey,
        })
        .returning();

      return { success: true, redemptionId: redemption.id };
    });

    // Audit log (outside transaction Ã¢â‚¬â€ non-critical)
    await createAuditLog({
      action: 'REDEMPTION_CREATE',
      actorId: input.userId,
      targetId: input.rewardId,
      targetType: 'reward',
      description: `User redeemed reward`,
      metadata: {
        redemptionId: result.redemptionId,
        // NEVER log the encrypted payload or credentials
      },
    });

    return result;
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    if (err?.code === '23505' && err?.constraint === 'redemptions_idempotency_key_key') {
      const existing = await db.query.redemptions.findFirst({ where: eq(redemptions.idempotencyKey, input.idempotencyKey) });
      if (existing) {
        if (existing.userId !== input.userId) {
          throw new Error('IDEMPOTENCY_KEY_MISMATCH');
        }
        return { success: true, redemptionId: existing.id };
      }
    }
    const message = error instanceof Error ? error.message : 'Unknown error';

    const errorMap: Record<string, string> = {
      REWARD_NOT_FOUND: 'Reward not found',
      REWARD_NOT_AVAILABLE: 'This reward is currently unavailable',
      REWARD_OUT_OF_STOCK: 'This reward is out of stock',
      REWARD_NOT_AVAILABLE_YET: 'This reward is not available yet',
      REWARD_EXPIRED: 'This reward has expired',
      MAX_REDEMPTIONS_REACHED: 'You have reached the maximum redemptions for this reward',
      INSUFFICIENT_BALANCE: 'Insufficient points balance',
    };

    return {
      success: false,
      error: errorMap[message] || 'Failed to redeem reward',
    };
  }
}







