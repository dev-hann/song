'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { AppLayout } from '@/components/app-layout';
import { AudioProvider } from '@/context/audio-context';
import { apiFetch } from '@/lib/api-client';

export default function MainLayoutClient({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'unauthenticated' || !session) {return;}

    let cancelled = false;

    async function check() {
      try {
        const result = await apiFetch<{ needsOnboarding: boolean }>('/api/onboarding/status');
        if (!cancelled && result.needsOnboarding && pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
      } catch {
      } finally {
        if (!cancelled) {
          setCheckingOnboarding(false);
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    check();
    return () => { cancelled = true; };
  }, [status, session, router, pathname]);

  if (status === 'loading' || checkingOnboarding) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!session) {return null;}

  return (
    <AudioProvider>
      <AppLayout>
        {children}
      </AppLayout>
    </AudioProvider>
  );
}
