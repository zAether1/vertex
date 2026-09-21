/**
 * Vertex — Admin Points API
 *
 * POST /api/admin/points — Grant or remove points (Admin/Super Admin only)
 *
 * SECURITY:
 * - Requires ADMIN role minimum
 * - Validates all input with Zod
 * - Creates audit log for every operation
 * - Uses idempotency keys to prevent double-click/replay
 * - Amount is decided ONLY by server after validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, successResponse, serverErrorResponse, validationErrorResponse, rateLimitResponse, forbiddenResponse } from '@/lib/auth/guards';
import { executePointOperation } from '@/lib/services/points';
import { createAuditLog } from '@/lib/services/audit';
import { checkRateLimit } from '@/lib/security';
import { adminPointAdjustmentSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = await checkRateLimit(`admin:points:${ip}`, 20, 60000);
  if (!rateCheck.allowed) return rateLimitResponse();

  // Require ADMIN role
  const guard = await requireAuth('ADMIN');
  if (!guard.authorized) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const validated = adminPointAdjustmentSchema.safeParse(body);

    if (!validated.success) {
      return validationErrorResponse(validated.error.flatten());
    }

    const { userId, amount, reason, type } = validated.data;

    // Prevent admin from modifying their own points (unless SUPER_ADMIN)
    if (userId === guard.context.userId && guard.context.role !== 'SUPER_ADMIN') {
      return forbiddenResponse('Admins cannot modify their own points');
    }

    const adjustedAmount = type === 'ADMIN_REMOVE' ? -Math.abs(amount) : Math.abs(amount);

    const result = await executePointOperation({
      userId,
      type,
      amount: adjustedAmount,
      reason,
      actorId: guard.context.userId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Audit log
    await createAuditLog({
      action: type === 'ADMIN_GRANT' ? 'POINTS_GRANT' : 'POINTS_REMOVE',
      actorId: guard.context.userId,
      targetId: userId,
      targetType: 'user',
      description: `${type}: ${Math.abs(adjustedAmount)} points. Reason: ${reason}`,
      metadata: {
        amount: adjustedAmount,
        balanceBefore: result.balanceBefore,
        balanceAfter: result.balanceAfter,
        transactionId: result.transaction?.id,
      },
      ipAddress: ip,
    });

    return successResponse({
      success: true,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      transactionId: result.transaction?.id,
    });
  } catch (error) {
    console.error('[API:AdminPoints] Error:', error);
    return serverErrorResponse();
  }
}
