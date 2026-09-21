/**
 * Vertex — Play Game API
 *
 * POST /api/games/play — Execute a game round with server-side RNG
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse, validationErrorResponse, rateLimitResponse } from '@/lib/auth/guards';
import { playGame } from '@/lib/services/games';
import { checkRateLimit } from '@/lib/security';
import { playGameSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  // Strict rate limit on game plays
  const rateCheck = await checkRateLimit(`games:play:${ip}`, 30, 60000);
  if (!rateCheck.allowed) return rateLimitResponse();

  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const validated = playGameSchema.safeParse(body);

    if (!validated.success) {
      return validationErrorResponse(validated.error.flatten());
    }

    const result = await playGame({
      gameId: validated.data.gameId,
      userId: guard.context.userId,
      betAmount: validated.data.betAmount,
      choice: validated.data.choice,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return successResponse({
      result: result.result,
      payout: result.payout,
      netResult: result.netResult,
      resultData: result.resultData,
      balanceAfter: result.balanceAfter,
    });
  } catch (error) {
    console.error('[API:PlayGame] Error:', error);
    return serverErrorResponse();
  }
}
