/**
 * Vertex — Point Economy Service
 *
 * THE most critical service in the platform. All point mutations
 * go through this module. No other code should modify point_accounts directly.
 *
 * SECURITY INVARIANTS:
 * 1. Every point change creates an immutable transaction record.
 * 2. Balance is computed from balanceBefore + amount; never from client input.
 * 3. All operations run inside a PostgreSQL transaction with row-level locks.
 * 4. Negative balance is prevented by both application logic AND a DB CHECK constraint.
 * 5. Idempotency keys prevent duplicate operations (double-click, replay).
 * 6. The frontend NEVER decides how many points to grant or what anything costs.
 */

import { db } from '@/lib/db';
import { pointAccounts, pointTransactions, transactionTypeEnum } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { generateIdempotencyKey } from '@/lib/security';

/* ─── Types ─────────────────────────────────────────────── */

export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];

export interface PointOperationInput {
  userId: string;
  type: TransactionType;
  amount: number; // positive = credit, negative = debit
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  actorId?: string | null; // null = system
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface PointOperationResult {
  success: boolean;
  transaction?: typeof pointTransactions.$inferSelect;
  balanceBefore: number;
  balanceAfter: number;
  error?: string;
}

/* ─── Core: Execute Point Operation (Atomic) ────────────── */

/**
 * Executes a point operation atomically.
 *
 * Uses SELECT ... FOR UPDATE to lock the user's point account row,
 * preventing race conditions between concurrent operations.
 */
export async function executePointOperation(
  input: PointOperationInput,
  dbClient: any = db
): Promise<PointOperationResult> {
  const idempotencyKey = input.idempotencyKey || generateIdempotencyKey();

  try {
    const runOp = async (tx: any) => {
      // 1. Check idempotency — prevent duplicate operations
      const existingTx = await tx.query.pointTransactions.findFirst({
        where: eq(pointTransactions.idempotencyKey, idempotencyKey),
      });

      if (existingTx) {
        return {
          success: true,
          transaction: existingTx,
          balanceBefore: existingTx.balanceBefore,
          balanceAfter: existingTx.balanceAfter,
          error: undefined,
        };
      }

      // 2. Lock the point account row (SELECT FOR UPDATE)
      const [account] = await tx
        .select()
        .from(pointAccounts)
        .where(eq(pointAccounts.userId, input.userId))
        .for('update');

      if (!account) {
        throw new Error('POINT_ACCOUNT_NOT_FOUND');
      }

      // 3. Calculate new balance
      const balanceBefore = account.balance;
      const balanceAfter = balanceBefore + input.amount;

      // 4. Prevent negative balance
      if (balanceAfter < 0) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // 5. Update account balance and aggregates atomically
      const updateData: Record<string, unknown> = {
        balance: balanceAfter,
        updatedAt: new Date(),
      };

      if (input.amount > 0) {
        const creditTypes: TransactionType[] = [
          'EARN', 'ADMIN_GRANT', 'MISSION_REWARD', 'GAME_REWARD',
          'BONUS', 'ACTIVITY_REWARD', 'CODE_REDEEM',
        ];
        if (creditTypes.includes(input.type)) {
          updateData.totalEarned = account.totalEarned + input.amount;
        }
        if (input.type === 'ADMIN_GRANT') {
          updateData.totalReceived = account.totalReceived + input.amount;
        }
      } else if (input.amount < 0) {
        updateData.totalSpent = account.totalSpent + Math.abs(input.amount);
      }

      if (input.type === 'ADMIN_GRANT' || input.type === 'ADMIN_REMOVE' || input.type === 'REVERSAL') {
        updateData.totalAdjusted = account.totalAdjusted + Math.abs(input.amount);
      }

      await tx
        .update(pointAccounts)
        .set(updateData)
        .where(eq(pointAccounts.userId, input.userId));

      // 6. Insert immutable transaction record
      const [transaction] = await tx
        .insert(pointTransactions)
        .values({
          userId: input.userId,
          type: input.type,
          amount: input.amount,
          balanceBefore,
          balanceAfter,
          reason: input.reason,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          actorId: input.actorId,
          idempotencyKey,
          metadata: input.metadata,
        })
        .returning();

      return {
        success: true,
        transaction,
        balanceBefore,
        balanceAfter,
        error: undefined,
      };
    };

    if (dbClient === db) {
      return db.transaction(runOp);
    } else {
      return runOp(dbClient);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'INSUFFICIENT_BALANCE') {
      return { success: false, balanceBefore: 0, balanceAfter: 0, error: 'Insufficient balance' };
    }
    if (message === 'POINT_ACCOUNT_NOT_FOUND') {
      return { success: false, balanceBefore: 0, balanceAfter: 0, error: 'Point account not found' };
    }

    console.error('[PointService] Operation failed:', message);
    return { success: false, balanceBefore: 0, balanceAfter: 0, error: 'Transaction failed' };
  }
}

/* ─── Convenience Functions ─────────────────────────────── */

export async function grantPoints(
  userId: string,
  amount: number,
  reason: string,
  actorId: string | null = null,
  opts?: { referenceType?: string; referenceId?: string; idempotencyKey?: string }
): Promise<PointOperationResult> {
  if (amount <= 0) {
    return { success: false, balanceBefore: 0, balanceAfter: 0, error: 'Amount must be positive' };
  }

  return executePointOperation({
    userId,
    type: actorId ? 'ADMIN_GRANT' : 'EARN',
    amount,
    reason,
    actorId,
    ...opts,
  });
}

export async function deductPoints(
  userId: string,
  amount: number,
  reason: string,
  type: TransactionType = 'SPEND',
  opts?: { referenceType?: string; referenceId?: string; idempotencyKey?: string; actorId?: string | null }
): Promise<PointOperationResult> {
  if (amount <= 0) {
    return { success: false, balanceBefore: 0, balanceAfter: 0, error: 'Amount must be positive' };
  }

  return executePointOperation({
    userId,
    type,
    amount: -amount, // negative for debit
    reason,
    actorId: opts?.actorId,
    ...opts,
  });
}

export async function getBalance(userId: string): Promise<number | null> {
  const account = await db.query.pointAccounts.findFirst({
    where: eq(pointAccounts.userId, userId),
  });
  return account?.balance ?? null;
}

export async function getPointAccount(userId: string) {
  return db.query.pointAccounts.findFirst({
    where: eq(pointAccounts.userId, userId),
  });
}

export async function createPointAccount(userId: string) {
  const [account] = await db
    .insert(pointAccounts)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  return account;
}
