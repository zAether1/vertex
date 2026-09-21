/**
 * Vertex — Rewards API Routes
 *
 * GET  /api/rewards          — List rewards (public marketplace)
 * POST /api/rewards/redeem   — Redeem a reward
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse, rateLimitResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { rewards } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, or, sql } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/security';
import { paginationSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = await checkRateLimit(`rewards:list:${ip}`, 60, 60000);
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
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const offset = (params.page - 1) * params.limit;
    const now = new Date();

    // Build conditions
    const conditions = [
      eq(rewards.status, 'ACTIVE'),
      or(
        sql`${rewards.startDate} IS NULL`,
        lte(rewards.startDate, now)
      ),
      or(
        sql`${rewards.endDate} IS NULL`,
        gte(rewards.endDate, now)
      ),
    ];

    // Fetch rewards — NEVER include private credentials
    const rewardList = await db
      .select({
        id: rewards.id,
        name: rewards.name,
        description: rewards.description,
        imageUrl: rewards.imageUrl,
        price: rewards.price,
        category: rewards.category,
        stock: rewards.stock,
        maxPerUser: rewards.maxPerUser,
        conditions: rewards.conditions,
        startDate: rewards.startDate,
        endDate: rewards.endDate,
        createdAt: rewards.createdAt,
        // NOTE: hasPrivatePayload, encryptedPayload, createdBy — EXCLUDED
      })
      .from(rewards)
      .where(and(...conditions))
      .orderBy(desc(rewards.createdAt))
      .limit(params.limit)
      .offset(offset);

    return successResponse({ rewards: rewardList });
  } catch (error) {
    console.error('[API:Rewards] Error:', error);
    return serverErrorResponse();
  }
}
