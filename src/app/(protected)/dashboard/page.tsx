import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DashboardClient from './DashboardClient';
export const metadata = { title: 'Inicio — Vertex', robots: { index: false, follow: false } };
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return <DashboardClient />;
}
