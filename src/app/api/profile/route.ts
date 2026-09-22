import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { profiles, users, pointAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const userProfile = await db
      .select({
        username: profiles.username,
        displayAlias: profiles.displayAlias,
        avatarUrl: profiles.avatarUrl,
        bio: profiles.bio,
        level: profiles.level,
        xp: profiles.xp,
        email: users.email,
        balance: pointAccounts.balance,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .leftJoin(pointAccounts, eq(profiles.userId, pointAccounts.userId))
      .where(eq(profiles.userId, guard.context.userId))
      .limit(1);

    if (!userProfile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return successResponse({
      success: true,
      data: userProfile[0],
    });
  } catch (error) {
    console.error('[API:Profile] GET Error:', error);
    return serverErrorResponse();
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const { displayAlias, bio, avatarUrl } = body;

    // Validate
    if (displayAlias !== undefined && (typeof displayAlias !== 'string' || displayAlias.length > 50)) {
      return NextResponse.json({ error: 'Invalid displayAlias' }, { status: 400 });
    }
    if (bio !== undefined && (typeof bio !== 'string' || bio.length > 300)) {
      return NextResponse.json({ error: 'Invalid bio' }, { status: 400 });
    }
    if (avatarUrl !== undefined && typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid avatarUrl' }, { status: 400 });
    }

    const updates: Partial<typeof profiles.$inferInsert> = {};
    if (displayAlias !== undefined) updates.displayAlias = displayAlias;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    updates.updatedAt = new Date();

    if (Object.keys(updates).length > 1) { // more than just updatedAt
      await db.update(profiles)
        .set(updates)
        .where(eq(profiles.userId, guard.context.userId));
    }

    return successResponse({
      success: true,
    });
  } catch (error) {
    console.error('[API:Profile] PATCH Error:', error);
    return serverErrorResponse();
  }
}
