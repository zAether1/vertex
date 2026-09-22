import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { missions, missionProgress } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const allMissions = await db
      .select({
        id: missions.id,
        name: missions.name,
        description: missions.description,
        reward: missions.reward,
        targetValue: missions.targetValue,
        targetType: missions.targetType,
        progressValue: missionProgress.currentValue,
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
      .where(eq(missions.status, 'ACTIVE'));

    // Process to match client expectations
    const processed = allMissions.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      reward: m.reward,
      targetValue: m.targetValue,
      currentValue: m.progressValue || 0,
      isCompleted: m.status === 'COMPLETED' || m.status === 'CLAIMED',
      isClaimed: m.status === 'CLAIMED',
      status: m.status || 'AVAILABLE',
    }));

    return successResponse({
      success: true,
      data: processed,
    });
  } catch (error) {
    console.error('[API:Missions] GET Error:', error);
    return serverErrorResponse();
  }
}
