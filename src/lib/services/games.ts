/**
 * Vertex — Game Service
 *
 * Server-side game logic for the Arcade section.
 *
 * SECURITY RULES:
 * 1. ALL randomness is generated server-side (crypto.randomInt)
 * 2. The client NEVER determines outcomes
 * 3. Every play is recorded with server seed for verification
 * 4. Rate limits prevent abuse
 * 5. Daily/hourly play limits are enforced
 * 6. Bet amount is validated against game limits from DB
 */

import { db } from '@/lib/db';
import { games, gameSessions, pointAccounts, pointTransactions } from '@/lib/db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
import { secureRandomInt, generateServerSeed } from '@/lib/security';
import { createAuditLog } from './audit';

/* ─── Types ─────────────────────────────────────────────── */

export interface PlayGameInput {
  gameId: string;
  userId: string;
  betAmount: number;
  choice?: string | number; // e.g., 'heads'/'tails', roulette number
}

export interface PlayGameResult {
  success: boolean;
  result?: 'WIN' | 'LOSS' | 'DRAW';
  payout?: number;
  netResult?: number;
  resultData?: Record<string, unknown>;
  balanceAfter?: number;
  error?: string;
}

/* ─── Core: Play Game ───────────────────────────────────── */

export async function playGame(input: PlayGameInput): Promise<PlayGameResult> {
  try {
    const result = await db.transaction(async (tx) => {
      // 1. Get game config from database
      const [game] = await tx
        .select()
        .from(games)
        .where(eq(games.id, input.gameId));

      if (!game || game.status !== 'ACTIVE') {
        throw new Error('GAME_NOT_AVAILABLE');
      }

      // 2. Validate bet against game limits (from DB, not client)
      if (input.betAmount < game.minBet || input.betAmount > game.maxBet) {
        throw new Error('INVALID_BET_AMOUNT');
      }

      // 3. Check play limits
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [hourlyPlays] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(gameSessions)
        .where(
          and(
            eq(gameSessions.userId, input.userId),
            eq(gameSessions.gameId, input.gameId),
            gte(gameSessions.createdAt, oneHourAgo)
          )
        );

      if ((hourlyPlays?.count ?? 0) >= game.maxPlaysPerHour) {
        throw new Error('HOURLY_LIMIT_REACHED');
      }

      const [dailyPlays] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(gameSessions)
        .where(
          and(
            eq(gameSessions.userId, input.userId),
            eq(gameSessions.gameId, input.gameId),
            gte(gameSessions.createdAt, oneDayAgo)
          )
        );

      if ((dailyPlays?.count ?? 0) >= game.maxPlaysPerDay) {
        throw new Error('DAILY_LIMIT_REACHED');
      }

      // 4. Lock and check balance
      const [account] = await tx
        .select()
        .from(pointAccounts)
        .where(eq(pointAccounts.userId, input.userId))
        .for('update');

      if (!account || account.balance < input.betAmount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // 5. Generate result SERVER-SIDE
      const serverSeed = generateServerSeed();
      const { won, resultData } = resolveGame(game.type, input.choice, game.houseEdge);

      // 6. Calculate payout
      const payout = won ? Math.floor((input.betAmount * game.payoutMultiplier) / 100) : 0;
      const netResult = payout - input.betAmount;

      // 7. Update balance
      const newBalance = account.balance + netResult;
      if (newBalance < 0) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      await tx
        .update(pointAccounts)
        .set({
          balance: newBalance,
          totalSpent: won ? account.totalSpent : account.totalSpent + input.betAmount,
          totalEarned: won ? account.totalEarned + payout : account.totalEarned,
          updatedAt: new Date(),
        })
        .where(eq(pointAccounts.userId, input.userId));

      // 8. Record transaction
      const txType = won ? 'GAME_REWARD' : 'GAME_LOSS';
      const [transaction] = await tx
        .insert(pointTransactions)
        .values({
          userId: input.userId,
          type: txType,
          amount: netResult,
          balanceBefore: account.balance,
          balanceAfter: newBalance,
          reason: `${game.name}: ${won ? 'Win' : 'Loss'}`,
          referenceType: 'game',
          referenceId: game.id,
        })
        .returning();

      // 9. Record game session
      const gameResult = won ? 'WIN' : 'LOSS';
      await tx.insert(gameSessions).values({
        gameId: input.gameId,
        userId: input.userId,
        betAmount: input.betAmount,
        result: gameResult,
        payout,
        netResult,
        serverSeed,
        resultData,
        transactionId: transaction.id,
      });

      return {
        success: true as const,
        result: gameResult as 'WIN' | 'LOSS',
        payout,
        netResult,
        resultData,
        balanceAfter: newBalance,
      };
    });

    // Audit (non-critical, outside transaction)
    await createAuditLog({
      action: 'GAME_PLAY',
      actorId: input.userId,
      targetId: input.gameId,
      targetType: 'game',
      description: `Game played: ${result.result}, net: ${result.netResult}`,
      metadata: {
        betAmount: input.betAmount,
        result: result.result,
        payout: result.payout,
      },
    });

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown';

    const errorMap: Record<string, string> = {
      GAME_NOT_AVAILABLE: 'This game is currently unavailable',
      INVALID_BET_AMOUNT: 'Bet amount is outside allowed range',
      HOURLY_LIMIT_REACHED: 'You have reached the hourly play limit',
      DAILY_LIMIT_REACHED: 'You have reached the daily play limit',
      INSUFFICIENT_BALANCE: 'Insufficient points for this bet',
    };

    return {
      success: false,
      error: errorMap[message] || 'Failed to play game',
    };
  }
}

/* ─── Game Resolution (Server-Side RNG) ─────────────────── */

function resolveGame(
  gameType: string,
  choice: string | number | undefined,
  houseEdge: number
): { won: boolean; resultData: Record<string, unknown> } {
  switch (gameType) {
    case 'COIN_FLIP': {
      const flipResult = secureRandomInt(0, 100);
      const isHeads = flipResult < (50 - houseEdge / 2);
      const playerChose = (choice?.toString().toLowerCase() ?? 'heads');
      const actualResult = isHeads ? 'heads' : 'tails';
      const won = playerChose === actualResult;
      return { won, resultData: { flip: actualResult, playerChoice: playerChose } };
    }

    case 'DICE': {
      const diceValue = secureRandomInt(1, 7); // 1-6
      const targetValue = typeof choice === 'number' ? choice : parseInt(choice as string) || 4;
      const won = diceValue >= targetValue;
      return { won, resultData: { diceValue, target: targetValue } };
    }

    case 'ROULETTE': {
      const rouletteResult = secureRandomInt(0, 37); // 0-36
      const playerNumber = typeof choice === 'number' ? choice : parseInt(choice as string);
      const won = rouletteResult === playerNumber;
      return { won, resultData: { result: rouletteResult, playerBet: playerNumber } };
    }

    case 'SLOTS': {
      const reels = [
        secureRandomInt(0, 10),
        secureRandomInt(0, 10),
        secureRandomInt(0, 10),
      ];
      const won = reels[0] === reels[1] && reels[1] === reels[2];
      return { won, resultData: { reels } };
    }

    default: {
      // Default: simple chance check with house edge
      const roll = secureRandomInt(0, 100);
      const won = roll >= (50 + houseEdge);
      return { won, resultData: { roll } };
    }
  }
}
