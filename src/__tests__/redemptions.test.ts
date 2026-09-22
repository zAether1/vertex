import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

interface MockDb {
  _lastUserIdChecked: string | null;
  select: () => MockDb;
  from: () => MockDb;
  innerJoin: () => MockDb;
  leftJoin: () => MockDb;
  where: (condition: { value: string }) => MockDb;
  orderBy: () => MockDb;
  then: (resolve: (data: unknown[]) => void) => void;
}

const mockDb = vi.hoisted(() => {
  const db: MockDb = {
    _lastUserIdChecked: null,
    select: () => db,
    from: () => db,
    innerJoin: () => db,
    leftJoin: () => db,
    where: (condition: { value: string }) => {
      db._lastUserIdChecked = condition.value;
      return db;
    },
    orderBy: () => db,
    then: (resolve: (data: unknown[]) => void) => {
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
  NextResponse: {
    json: (body: unknown, init?: { status: number }) => ({
      status: init?.status || 200,
      json: async () => body,
    }),
  },
}));

const mockContextUser = vi.hoisted(() => ({ userId: 'user-a', authorized: true }));
vi.mock('@/lib/auth/guards', () => ({
  requireAuth: vi.fn(() => mockContextUser),
}));

import { GET } from '@/app/api/redemptions/me/route';

describe('Redemptions Private Payload (IDOR)', () => {
  it('should return payload if user owns redemption (userId matches)', async () => {
    mockContextUser.userId = 'user-a';
    const req = { url: 'http://localhost/api/redemptions/me' } as unknown as NextRequest;
    const res = await GET(req) as { status: number; json: () => Promise<unknown> };
    const data = await res.json() as { data: { privatePayload: string }[] };
    expect(res.status).toBe(200);
    expect(data.data[0].privatePayload).toBe('ENCRYPTED_SECRET');
  });

  it('should not return others redemptions (userId different)', async () => {
    mockContextUser.userId = 'user-b';
    const req = { url: 'http://localhost/api/redemptions/me' } as unknown as NextRequest;
    const res = await GET(req) as { status: number; json: () => Promise<unknown> };
    const data = await res.json() as { data: unknown[] };
    expect(res.status).toBe(200);
    expect(data.data.length).toBe(0);
  });
});
