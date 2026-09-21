/**
 * Vertex — Redeem Reward API
 *
 * POST /api/rewards/redeem — Atomically redeem a reward
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse, validationErrorResponse, rateLimitResponse } from '@/lib/auth/guards';
import { redeemReward } from '@/lib/services/redemptions';
import { checkRateLimit } from '@/lib/security';
import { redeemRewardSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  // Strict rate limit on redemptions
  const rateCheck = await checkRateLimit(`redeem:${ip}`, 10, 60000);
  if (!rateCheck.allowed) return rateLimitResponse();

  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const validated = redeemRewardSchema.safeParse(body);

    if (!validated.success) {
      return validationErrorResponse(validated.error.flatten());
    }

    const result = await redeemReward({
      userId: guard.context.userId,
      rewardId: validated.data.rewardId,
      idempotencyKey: validated.data.idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return successResponse({
      success: true,
      redemptionId: result.redemptionId,
    });
  } catch (error) {
    console.error('[API:Redeem] Error:', error);
    return serverErrorResponse();
  }
}
