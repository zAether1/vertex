import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { achievements, userAchievements } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const allAchievements = await db
      .select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        iconUrl: achievements.iconUrl,
        category: achievements.category,
        rarity: achievements.rarity,
        isHidden: achievements.isHidden,
        unlocked: userAchievements.id,
        awardedAt: userAchievements.awardedAt,
      })
      .from(achievements)
      .leftJoin(
        userAchievements,
        and(
          eq(achievements.id, userAchievements.achievementId),
          eq(userAchievements.userId, guard.context.userId)
        )
      )
      .orderBy(asc(achievements.sortOrder));

    // Process to format nicely
    const processed = allAchievements.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      iconUrl: a.iconUrl,
      category: a.category,
      rarity: a.rarity,
      isHidden: a.isHidden,
      isUnlocked: !!a.unlocked,
      awardedAt: a.awardedAt,
    }));

    return successResponse({
      success: true,
      data: processed,
    });
  } catch (error) {
    console.error('[API:Achievements] GET Error:', error);
    return serverErrorResponse();
  }
}
