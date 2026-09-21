/**
 * Vertex — Points API Routes
 *
 * GET  /api/points          — Get current user's point account
 * GET  /api/points/history   — Get transaction history
 * POST /api/points/admin     — Admin: grant/remove points
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse, validationErrorResponse, rateLimitResponse } from '@/lib/auth/guards';
import { getPointAccount } from '@/lib/services/points';
import { db } from '@/lib/db';
import { pointTransactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/security';
import { paginationSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = await checkRateLimit(`points:get:${ip}`, 60, 60000);
  if (!rateCheck.allowed) return rateLimitResponse();

  // Auth check
  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const account = await getPointAccount(guard.context.userId);
    if (!account) {
      return successResponse({
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        totalReceived: 0,
        totalAdjusted: 0,
      });
    }

    return successResponse({
      balance: account.balance,
      totalEarned: account.totalEarned,
      totalSpent: account.totalSpent,
      totalReceived: account.totalReceived,
      totalAdjusted: account.totalAdjusted,
    });
  } catch (error) {
    console.error('[API:Points] Error fetching account:', error);
    return serverErrorResponse();
  }
}
