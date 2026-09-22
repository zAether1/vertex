/**
 * Vertex â€” Registration API
 *
 * POST /api/auth/register â€” Create a new user account
 *
 * SECURITY:
 * - Password hashed with bcrypt (12 rounds)
 * - Username uniqueness enforced at DB level
 * - Rate limited to prevent mass account creation
 * - Creates point account automatically
 * - Audit log on registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, profiles, pointAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, checkRateLimit } from '@/lib/security';
import { createPointAccount } from '@/lib/services/points';
import { createAuditLog } from '@/lib/services/audit';
import { registerSchema } from '@/lib/validations';
import { serverErrorResponse, validationErrorResponse, rateLimitResponse } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = await checkRateLimit(`register:${ip}`, 5, 300000); // 5 per 5 min
  if (!rateCheck.allowed) return rateLimitResponse();

  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return validationErrorResponse(validated.error.flatten());
    }

    const { email, password, username, displayAlias } = validated.data;

    // Check existing user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este correo' },
        { status: 409 }
      );
    }

    // Check existing username
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.username, username),
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Este nombre de usuario ya estÃ¡ en uso' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user + profile in transaction
    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email,
          passwordHash,
          emailVerified: false,
          role: 'STUDENT',
          status: 'ACTIVE',
        })
        .returning();

      await tx.insert(profiles).values({
        userId: newUser.id,
        username,
        displayAlias: displayAlias || username,
      });

      await tx.insert(pointAccounts).values({
        userId: newUser.id,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      });

      return newUser;
    });

    await createAuditLog({
      action: 'USER_REGISTER',
      actorId: result.id,
      targetId: result.id,
      targetType: 'user',
      description: 'New user registered via email/password',
      ipAddress: ip,
    });

    return NextResponse.json(
      { success: true, message: 'Cuenta creada exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API:Register] Error:', error);
    return serverErrorResponse();
  }
}

