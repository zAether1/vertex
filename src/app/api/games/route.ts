/**
 * Vertex — Games API Route
 *
 * GET  /api/games     — List available games
 * POST /api/games/play — Play a game (server-side RNG)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse, rateLimitResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/security';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = await checkRateLimit(`games:list:${ip}`, 60, 60000);
  if (!rateCheck.allowed) return rateLimitResponse();

  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const gameList = await db
      .select({
        id: games.id,
        name: games.name,
        description: games.description,
        type: games.type,
        imageUrl: games.imageUrl,
        status: games.status,
        minBet: games.minBet,
        maxBet: games.maxBet,
        payoutMultiplier: games.payoutMultiplier,
        sortOrder: games.sortOrder,
      })
      .from(games)
      .where(eq(games.status, 'ACTIVE'))
      .orderBy(games.sortOrder);

    return successResponse({ games: gameList });
  } catch (error) {
    console.error('[API:Games] Error:', error);
    return serverErrorResponse();
  }
}
