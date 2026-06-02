import type { Metadata, Viewport } from 'next';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { SerwistProvider } from '@serwist/turbopack/react';
import { DisableContextMenu } from '@/components/providers/disable-context-menu';
import { QueryClientProvider } from '@/components/providers/query-provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'SONG',
  description: '우리만의 음악 공간',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SONG',
  },
  openGraph: {
    title: 'SONG',
    description: '우리만의 음악 공간',
    type: 'website',
    siteName: 'SONG',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: 'SONG',
    description: '우리만의 음악 공간',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <DisableContextMenu>
            <SerwistProvider swUrl="/serwist/sw.js">
              <QueryClientProvider>
                {children}
                <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: 'var(--color-surface-elevated)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-border)',
                  },
                }}
              />
            </QueryClientProvider>
            </SerwistProvider>
            </DisableContextMenu>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
