/**
 * Vertex — Auth.js Type Extensions
 *
 * Extends the NextAuth types to include custom fields
 * like role and status in the session and JWT token.
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: string;
      status: string;
    };
  }

  interface User {
    role?: string;
    status?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    role: string;
    status: string;
  }
}
