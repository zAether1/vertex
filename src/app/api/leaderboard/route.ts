import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const topProfiles = await db
      .select({
        id: profiles.userId, 
        username: profiles.username,
        displayAlias: profiles.displayAlias,
        avatarUrl: profiles.avatarUrl,
        level: profiles.level,
        xp: profiles.xp,
      })
      .from(profiles)
      .where(eq(profiles.isPublic, true))
      .orderBy(desc(profiles.xp))
      .limit(100);

    return successResponse({
      success: true,
      data: topProfiles,
    });
  } catch (error) {
    console.error('[API:Leaderboard] GET Error:', error);
    return serverErrorResponse();
  }
}
