/**
 * Vertex â€” Auth.js Configuration
 *
 * Configures NextAuth v5 (Auth.js) with:
 * - Credentials provider (email/password)
 * - Google OAuth (requires env vars)
 *
 * SECURITY:
 * - Passwords hashed with bcrypt (12 rounds)
 * - Session tokens in HttpOnly cookies (managed by Auth.js)
 * - OAuth tokens are NOT stored â€” only the provider account ID
 * - Failed login attempts tracked with temporary lockout
 * - All auth events create audit logs
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/db';
import { users, profiles, oauthAccounts, sessions as sessionsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword } from '@/lib/security';
import { createPointAccount } from '@/lib/services/points';
import { createAuditLog, createSecurityEvent } from '@/lib/services/audit';
import type { NextAuthConfig } from 'next-auth';

/* â”€â”€â”€ Auth Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // refresh token every hour
  },

  cookies: {
    sessionToken: {
      name: '__Secure-vertex.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  providers: [
    /* â”€â”€ Credentials (Email/Password) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          return null;
        }

        // Check account status
        if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
          return null;
        }

        // Check lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await createSecurityEvent({
            eventType: 'ACCOUNT_LOCKED',
            actorId: user.id,
            description: 'Login attempt on locked account',
          });
          return null;
        }

        // Verify password
        if (!user.passwordHash) {
          return null; // OAuth-only account
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          // Increment failed attempts
          const attempts = user.failedLoginAttempts + 1;
          const lockUntil = attempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 min after 5 failures
            : null;

          await db
            .update(users)
            .set({
              failedLoginAttempts: attempts,
              lockedUntil: lockUntil,
            })
            .where(eq(users.id, user.id));

          await createSecurityEvent({
            eventType: 'FAILED_LOGIN',
            actorId: user.id,
            description: `Failed login attempt ${attempts}/5`,
            severity: attempts >= 3 ? 'WARNING' : 'INFO',
          });

          return null;
        }

        // Successful login â€” reset failed attempts
        await db
          .update(users)
          .set({
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          })
          .where(eq(users.id, user.id));

        await createAuditLog({
          action: 'USER_LOGIN',
          actorId: user.id,
          targetId: user.id,
          targetType: 'user',
          description: 'Successful login via credentials',
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),

    /* â”€â”€ Google OAuth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider && account.provider !== 'credentials') {
        // OAuth flow: find or create user
        const existingOAuth = await db.query.oauthAccounts.findFirst({
          where: and(
            eq(oauthAccounts.provider, account.provider),
            eq(oauthAccounts.providerAccountId, account.providerAccountId ?? '')
          ),
        });

        if (existingOAuth) {
          // Update last login
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, existingOAuth.userId));

          // Set the user id so JWT callback can use it
          user.id = existingOAuth.userId;
        } else {
          // Create new user + profile + point account
          const [newUser] = await db
            .insert(users)
            .values({
              email: user.email?.toLowerCase(),
              emailVerified: true,
              role: 'STUDENT',
              status: 'ACTIVE',
            })
            .returning();

          // Create profile with generated username
          const username = `user_${newUser.id.substring(0, 8)}`;
          await db.insert(profiles).values({
            userId: newUser.id,
            username,
            displayAlias: user.name || username,
            avatarUrl: user.image,
          });

          // Link OAuth account (we do NOT store tokens)
          await db.insert(oauthAccounts).values({
            userId: newUser.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId ?? '',
          });

          // Create point account
          await createPointAccount(newUser.id);

          await createAuditLog({
            action: 'USER_REGISTER',
            actorId: newUser.id,
            targetId: newUser.id,
            targetType: 'user',
            description: `New user registered via ${account.provider}`,
          });

          user.id = newUser.id;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string;

        // Fetch role from database (never trust client)
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id as string),
          columns: { role: true, status: true },
        });

        token.role = dbUser?.role || 'STUDENT';
        token.status = dbUser?.status || 'ACTIVE';
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = (token.userId as string) || "";
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export { authConfig };



