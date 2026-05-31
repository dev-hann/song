'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppLayout } from '@/components/app-layout';
import { AudioProvider } from '@/context/audio-context';

export default function MainLayoutClient({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
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
