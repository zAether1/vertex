import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockDb = vi.hoisted(() => {
  const db: any = {
    _lastUserIdChecked: null,
    select: () => db,
    from: () => db,
    innerJoin: () => db,
    leftJoin: () => db,
    where: (condition: any) => {
      db._lastUserIdChecked = condition.value;
      return db;
    },
    orderBy: () => db,
    then: (resolve: any) => {
      // Simulate DB filtering: only return rows if the queried user is 'user-a'
      if (db._lastUserIdChecked === 'user-a') {
        resolve([
          {
            id: 'red-1',
            pointsSpent: 100,
            status: 'FULFILLED',
            createdAt: new Date().toISOString(),
            reward: { name: 'Tarjeta ', category: 'DIGITAL', imageUrl: null, hasPrivatePayload: true },
            inventory: { encryptedPayload: 'ENCRYPTED_SECRET' },
          }
        ]);
      } else {
        // user-b has no redemptions
        resolve([]);
      }
    }
  };
  return db;
});

vi.mock('@/lib/db', () => ({ db: mockDb }));

vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    url = 'http://localhost/api/redemptions/me';
    headers = new Map([['x-forwarded-for', '127.0.0.1']]);
  },
  NextResponse: {
    json: (body: any, init?: any) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/lib/security', () => ({
  checkRateLimit: async () => ({ allowed: true }),
  decrypt: (payload: string) => {
    if (payload === 'ENCRYPTED_SECRET') return 'DECRYPTED_SECRET';
    throw new Error('Invalid payload');
  },
}));

const mockGuardState = vi.hoisted(() => ({ authorized: false, error: 'Unauthorized', status: 401, context: { userId: '' } }));

vi.mock('@/lib/auth/guards', () => ({
  requireAuth: async () => mockGuardState.authorized ? { authorized: true, context: mockGuardState.context } : { authorized: false, error: mockGuardState.error, status: mockGuardState.status },
  rateLimitResponse: () => ({ status: 429 }),
  successResponse: (data: any) => ({ body: data, status: 200 }),
}));

vi.mock('drizzle-orm', async (importOriginal) => { 
  const actual: any = await importOriginal(); 
  return { ...actual, eq: (a: any, b: any) => ({ value: b }), desc: () => {} }; 
});

import { GET } from '../app/api/redemptions/me/route';

describe('Redemptions API - GET /api/redemptions/me', () => {
  it('A. Usuario sin sesion NO puede acceder (Devuelve 401)', async () => {
    mockGuardState.authorized = false;
    mockGuardState.status = 401;
    const req = new NextRequest('http://localhost');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('B. Usuario A puede ver sus redenciones (Autenticado y Descifrado Correcto)', async () => {
    mockGuardState.authorized = true;
    mockGuardState.context = { userId: 'user-a' };
    const req = new NextRequest('http://localhost');
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    expect(mockDb._lastUserIdChecked).toBe('user-a');
    
    const data = (res as any).body.data;
    expect(data.length).toBe(1);
    expect(data[0].id).toBe('red-1');
    expect(data[0].secretCode).toBe('DECRYPTED_SECRET');
  });

  it('C. Usuario B no puede ver redenciones de A (Proteccion IDOR Real)', async () => {
    mockGuardState.authorized = true;
    mockGuardState.context = { userId: 'user-b' };
    const req = new NextRequest('http://localhost');
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    expect(mockDb._lastUserIdChecked).toBe('user-b');
    
    // Check that user-b receives NOTHING, no secret codes, no data from user-a
    const data = (res as any).body.data;
    expect(data.length).toBe(0);
    expect(data).toEqual([]);
  });

  it('D. EncryptedPayload jamas debe aparecer en la respuesta y el secreto es descifrado en API', async () => {
    mockGuardState.authorized = true;
    mockGuardState.context = { userId: 'user-a' };
    const req = new NextRequest('http://localhost');
    const res = await GET(req);
    const data = (res as any).body.data;
    
    expect(data[0]).not.toHaveProperty('encryptedPayload');
    expect(data[0]).not.toHaveProperty('inventory');
    expect(data[0].secretCode).toBe('DECRYPTED_SECRET');
  });
});
