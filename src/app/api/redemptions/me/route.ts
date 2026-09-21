/**
 * Vertex — My Redemptions API
 *
 * GET /api/redemptions/me — Fetch authenticated user's redemptions
 *
 * SECURITY:
 * - Requires authentication.
 * - Extracts userId strictly from session (prevents IDOR).
 * - Decrypts digital payloads ONLY for the owner.
 * - Rate limited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse, rateLimitResponse } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { redemptions, rewards, rewardInventory } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { checkRateLimit, decrypt } from '@/lib/security';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  // Rate limit: protect decryption endpoint from abuse
  const rateCheck = await checkRateLimit(`redemptions:me:${ip}`, 30, 60000);
  if (!rateCheck.allowed) return rateLimitResponse();

  const guard = await requireAuth();
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    // Fetch redemptions belonging strictly to the authenticated user
    const userRedemptions = await db
      .select({
        id: redemptions.id,
        pointsSpent: redemptions.pointsSpent,
        status: redemptions.status,
        createdAt: redemptions.createdAt,
        reward: {
          name: rewards.name,
          category: rewards.category,
          imageUrl: rewards.imageUrl,
          hasPrivatePayload: rewards.hasPrivatePayload,
        },
        inventory: {
          encryptedPayload: rewardInventory.encryptedPayload,
        },
      })
      .from(redemptions)
      .innerJoin(rewards, eq(redemptions.rewardId, rewards.id))
      .leftJoin(rewardInventory, eq(redemptions.inventoryItemId, rewardInventory.id))
      .where(eq(redemptions.userId, guard.context.userId))
      .orderBy(desc(redemptions.createdAt));

    // Process and decrypt ONLY in memory
    const processedRedemptions = userRedemptions.map((r) => {
      let secretCode: string | null = null;
      
      // Decrypt only if the status is fulfilled and we have an encrypted payload
      if (r.status === 'FULFILLED' && r.inventory?.encryptedPayload) {
        try {
          secretCode = decrypt(r.inventory.encryptedPayload);
        } catch (err) {
          console.error('[API:Redemptions] Decryption failed for redemption:', r.id);
          // Do not expose the exact error to the user
        }
      }

      return {
        id: r.id,
        pointsSpent: r.pointsSpent,
        status: r.status,
        createdAt: r.createdAt,
        reward: {
          name: r.reward.name,
          category: r.reward.category,
          imageUrl: r.reward.imageUrl,
          hasPrivatePayload: r.reward.hasPrivatePayload,
        },
        secretCode, // This is sent in the response but NEVER stored or logged again
      };
    });

    return successResponse({
      success: true,
      data: processedRedemptions,
    });
  } catch (error) {
    console.error('[API:Redemptions] Error fetching redemptions:', error);
    return serverErrorResponse();
  }
}
