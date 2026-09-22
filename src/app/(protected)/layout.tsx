/**
 * Vertex - Protected Layout
 * Wraps all authenticated student routes, enforcing login.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div style={{ width: '100%', padding: '24px 0' }}>
      {children}
    </div>
  );
}
