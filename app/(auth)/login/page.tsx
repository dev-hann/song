'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) { router.replace('/home'); }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    );
  }

  if (session) { return null; }

  const handleSignIn = () => {
    setError(null);
    signIn('google', { callbackUrl: '/home' }).catch(() => {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-xl)] bg-surface">
            <svg className="h-10 w-10 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" fill="currentColor" />
              <circle cx="18" cy="16" r="3" fill="currentColor" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">SONG</h1>
            <p className="mt-2 text-sm text-muted">Google 계정으로 로그인하세요</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={() => { handleSignIn(); }}
            variant="outline"
            size="lg"
            className="h-12 w-full gap-3 rounded-[var(--radius-lg)] text-base"
          >
            <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 계속하기
          </Button>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
