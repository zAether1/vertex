/**
 * Vertex — RBAC Guard
 *
 * Server-side authorization functions.
 * NEVER trust permissions from the frontend.
 * Every sensitive operation must pass through these guards.
 */

import { auth } from '@/lib/auth';
import { createSecurityEvent } from '@/lib/services/audit';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* ─── Role Hierarchy ────────────────────────────────────── */

const ROLE_HIERARCHY: Record<string, number> = {
  STUDENT: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

/* ─── Guard Types ───────────────────────────────────────── */

export interface AuthContext {
  userId: string;
  role: string;
  status: string;
  email?: string | null;
}

type GuardResult =
  | { authorized: true; context: AuthContext }
  | { authorized: false; error: string; status: number };

/* ─── Core Guard ────────────────────────────────────────── */

/**
 * Checks that the request comes from an authenticated user
 * with the minimum required role.
 */
export async function requireAuth(
  minimumRole: string = 'STUDENT'
): Promise<GuardResult> {
  const session = await auth();

  if (!session?.user) {
    return { authorized: false, error: 'Autenticación requerida', status: 401 };
  }

  if (session.user.status === 'SUSPENDED' || session.user.status === 'BANNED') {
    return { authorized: false, error: 'Cuenta suspendida', status: 403 };
  }

  const userLevel = ROLE_HIERARCHY[session.user.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

  if (userLevel < requiredLevel) {
    // Log privilege escalation attempts
    await createSecurityEvent({
      eventType: 'PERMISSION_DENIED',
      actorId: session.user.id,
      description: `User with role ${session.user.role} attempted to access resource requiring ${minimumRole}`,
      severity: 'WARNING',
    });

    return { authorized: false, error: 'Permisos insuficientes', status: 403 };
  }

  return {
    authorized: true,
    context: {
      userId: session.user.id,
      role: session.user.role,
      status: session.user.status,
      email: session.user.email,
    },
  };
}

/**
 * Checks that the user is requesting their own resource (ownership check).
 * Admins can access any user's resources.
 */
export async function requireOwnerOrAdmin(
  resourceOwnerId: string
): Promise<GuardResult> {
  const result = await requireAuth();

  if (!result.authorized) return result;

  const { context } = result;
  const isOwner = context.userId === resourceOwnerId;
  const isAdmin = ROLE_HIERARCHY[context.role] >= ROLE_HIERARCHY['ADMIN'];

  if (!isOwner && !isAdmin) {
    await createSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      actorId: context.userId,
      description: `IDOR attempt: user tried to access resource owned by ${resourceOwnerId}`,
      severity: 'WARNING',
    });

    return { authorized: false, error: 'Acceso denegado', status: 403 };
  }

  return result;
}

/* ─── API Response Helpers ──────────────────────────────── */

export function unauthorizedResponse(message: string = 'No autorizado'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(message: string = 'Acceso denegado'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

export function validationErrorResponse(errors: unknown): NextResponse {
  return NextResponse.json(
    { error: 'Error de validación', details: errors },
    { status: 400 }
  );
}

export function serverErrorResponse(message: string = 'Error del servidor'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

export function successResponse(data: unknown, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
    { status: 429 }
  );
}
