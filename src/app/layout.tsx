import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, pointAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const inter = localFont({
  src: [
    { path: '../../public/fonts/inter/InterVariable-latin.woff2', style: 'normal' },
    { path: '../../public/fonts/inter/InterVariable-latin-ext.woff2', style: 'normal' }
  ],
  variable: '--font-inter',
  display: 'swap',
});

const coolvetica = localFont({
  src: [
    { path: '../../public/fonts/coolvetica/coolvetica-latin.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/coolvetica/coolvetica-latin-ext.woff2', weight: '400', style: 'normal' }
  ],
  variable: '--font-coolvetica',
  display: 'swap',
});

export const viewport = { themeColor: '#141415' };
export const metadata: Metadata = {
  title: 'Vertex',
  description: 'Plataforma de Recompensas',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/favicons/favicon-v3.ico' },
      { url: '/favicons/favicon-v3.svg', type: 'image/svg+xml' },
      { url: '/favicons/android-chrome-192x192-v3.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicons/android-chrome-512x512-v3.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/favicons/apple-touch-icon-v3.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vertex'
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  let username = undefined;
  let avatarUrl = null;
  let balance = undefined;

  if (session?.user) {
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
  }

  return (
    <html lang="es" className={`${inter.variable} ${coolvetica.variable}`}>
      <body>
        <div className="main-loader">
          <Sidebar />
          <div className="main-loader__body">
            <Header username={username} avatarUrl={avatarUrl} balance={balance} />
            <div className="main-loader__main">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

