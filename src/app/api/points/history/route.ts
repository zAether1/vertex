/**
 * Vertex — Points History API
 *
 * GET /api/points/history — Get paginated transaction history for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse, rateLimitResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { pointTransactions } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/security';
import { paginationSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = await checkRateLimit(`points:history:${ip}`, 30, 60000);
  if (!rateCheck.allowed) return rateLimitResponse();

  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const offset = (params.page - 1) * params.limit;

    const [transactions, totalResult] = await Promise.all([
      db
        .select({
          id: pointTransactions.id,
          type: pointTransactions.type,
          amount: pointTransactions.amount,
          balanceBefore: pointTransactions.balanceBefore,
          balanceAfter: pointTransactions.balanceAfter,
          reason: pointTransactions.reason,
          referenceType: pointTransactions.referenceType,
          createdAt: pointTransactions.createdAt,
        })
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, guard.context.userId))
        .orderBy(desc(pointTransactions.createdAt))
        .limit(params.limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, guard.context.userId)),
    ]);

    return successResponse({
      transactions,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalResult[0]?.total ?? 0,
        totalPages: Math.ceil((totalResult[0]?.total ?? 0) / params.limit),
      },
    });
  } catch (error) {
    console.error('[API:PointsHistory] Error:', error);
    return serverErrorResponse();
  }
}
