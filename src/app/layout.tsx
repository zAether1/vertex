import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${coolvetica.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}

