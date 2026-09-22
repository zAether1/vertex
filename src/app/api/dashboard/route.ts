import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { pointAccounts, profiles, pointTransactions, missions, missionProgress } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const userId = guard.context.userId;

    // 1. Balance
    const pAccount = await db
      .select({ balance: pointAccounts.balance })
      .from(pointAccounts)
      .where(eq(pointAccounts.userId, userId))
      .limit(1);
    const balance = pAccount.length ? pAccount[0].balance : 0;

    // 2. XP & Rank info
    const pProfile = await db
      .select({ xp: profiles.xp, level: profiles.level, alias: profiles.displayAlias, username: profiles.username })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
      
    const xp = pProfile.length ? pProfile[0].xp : 0;
    const level = pProfile.length ? pProfile[0].level : 1;
    const name = pProfile.length ? (pProfile[0].alias || pProfile[0].username) : 'Usuario';

    // 3. Recent Activity (last 5)
    const recentTx = await db
      .select({
        id: pointTransactions.id,
        amount: pointTransactions.amount,
        type: pointTransactions.type,
        reason: pointTransactions.reason,
        createdAt: pointTransactions.createdAt,
      })
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(5);

    // 4. Missions Stats
    // Available = ACTIVE status
    const allMissions = await db
      .select({
        missionId: missions.id,
        status: missionProgress.status,
      })
      .from(missions)
      .leftJoin(missionProgress, and(eq(missions.id, missionProgress.missionId), eq(missionProgress.userId, userId)))
      .where(eq(missions.status, 'ACTIVE'));

    let completedMissions = 0;
    let availableMissions = 0;

    allMissions.forEach(m => {
      if (m.status === 'COMPLETED' || m.status === 'CLAIMED') {
        completedMissions++;
      } else {
        availableMissions++;
      }
    });

    return successResponse({
      success: true,
      data: {
        user: { name, level, xp },
        stats: {
          balance,
          completedMissions,
          availableMissions,
          rank: 'N/A' // Requires calculating rank over all profiles, omit or leave as N/A for now for perf
        },
        recentActivity: recentTx.map(t => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          description: t.reason || t.type,
          date: t.createdAt
        }))
      },
    });
  } catch (error) {
    console.error('[API:Dashboard] GET Error:', error);
    return serverErrorResponse();
  }
}
