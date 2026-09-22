import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { missions, missionProgress, pointAccounts, pointTransactions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const { missionId } = body;

    if (!missionId) {
      return NextResponse.json({ error: 'missionId is required' }, { status: 400 });
    }

    // Use transaction to ensure idempotency and atomic updates
    const result = await db.transaction(async (tx) => {
      // 1. Get mission and progress
      const missionData = await tx
        .select({
          missionId: missions.id,
          reward: missions.reward,
          progressId: missionProgress.id,
          status: missionProgress.status,
        })
        .from(missions)
        .leftJoin(
          missionProgress,
          and(
            eq(missions.id, missionProgress.missionId),
            eq(missionProgress.userId, guard.context.userId)
          )
        )
        .where(eq(missions.id, missionId))
        .limit(1);

      if (!missionData.length) {
        throw new Error('MISSION_NOT_FOUND');
      }

      const md = missionData[0];
      if (!md.progressId) {
        throw new Error('MISSION_NOT_STARTED');
      }

      if (md.status === 'CLAIMED') {
        throw new Error('ALREADY_CLAIMED');
      }
      if (md.status !== 'COMPLETED') {
        throw new Error('NOT_COMPLETED');
      }

      // 2. Update mission progress to CLAIMED
      await tx.update(missionProgress)
        .set({ 
          status: 'CLAIMED',
          claimedAt: new Date(),
        })
        .where(eq(missionProgress.id, md.progressId));

      // 3. Update Point Account
      const account = await tx
        .select()
        .from(pointAccounts)
        .where(eq(pointAccounts.userId, guard.context.userId))
        .limit(1);

      let balanceBefore = 0;
      let balanceAfter = md.reward;

      if (account.length > 0) {
        balanceBefore = account[0].balance;
        balanceAfter = balanceBefore + md.reward;
        
        await tx.update(pointAccounts)
          .set({
            balance: balanceAfter,
            totalEarned: account[0].totalEarned + md.reward,
            updatedAt: new Date()
          })
          .where(eq(pointAccounts.userId, guard.context.userId));
      } else {
        // Edge case: User has no point account yet
        await tx.insert(pointAccounts).values({
          userId: guard.context.userId,
          balance: balanceAfter,
          totalEarned: balanceAfter,
        });
      }

      // 4. Record Transaction
      const idempotencyKey = `claim_${md.progressId}_REWARD`;
      
      await tx.insert(pointTransactions).values({
        userId: guard.context.userId,
        type: 'MISSION_REWARD',
        amount: md.reward,
        balanceBefore,
        balanceAfter,
        reason: 'Mission Claim',
        referenceType: 'mission_progress',
        referenceId: md.progressId,
        idempotencyKey,
      });

      return { balance: balanceAfter, reward: md.reward };
    });

    return successResponse({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('[API:MissionsClaim] Error:', error);
    if (error instanceof Error && error.message === 'ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'La misiÃ³n ya fue reclamada' }, { status: 409 });
    }
    if (error instanceof Error && error.message === 'NOT_COMPLETED') {
      return NextResponse.json({ error: 'La misiÃ³n aÃºn no estÃ¡ completada' }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'MISSION_NOT_FOUND') {
      return NextResponse.json({ error: 'MisiÃ³n no encontrada' }, { status: 404 });
    }
    return serverErrorResponse();
  }
}


