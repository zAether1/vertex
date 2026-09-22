/**
 * Vertex — Protected Layout (with Sidebar)
 *
 * Wraps all authenticated student routes with the sidebar navigation.
 * Session data is fetched server-side and passed to client components.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, pointAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Sidebar from '@/components/layout/Sidebar';
import styles from '@/components/layout/Sidebar.module.css';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch profile (public identity) and balance
  let username = 'User';
  let avatarUrl: string | null = null;
  let balance = 0;

  try {
    const [profile, account] = await Promise.all([
      db.query.profiles.findFirst({
        where: eq(profiles.userId, session.user.id),
      }),
      db.query.pointAccounts.findFirst({
        where: eq(pointAccounts.userId, session.user.id),
      }),
    ]);

    if (profile) {
      username = profile.displayAlias || profile.username;
      avatarUrl = profile.avatarUrl;
    }
    if (account) {
      balance = account.balance;
    }
  } catch (error) {
    console.error('[Layout] Failed to fetch profile/balance');
  }

  return (
    <div>
      <Sidebar
        username={username}
        avatarUrl={avatarUrl}
        balance={balance}
      />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
