import { useCallback, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/auth-context';
import { verifyCredential } from '@/services/api/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return;

      setLoading(true);
      try {
        const result = await verifyCredential(response.credential);

        if (result.registered && result.token && result.user) {
          setAuth(result.token, result.user);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '인증에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [setAuth],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-black px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">SONG</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Google 계정으로 로그인하세요
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {loading ? (
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google 로그인에 실패했습니다.')}
              text="continue_with"
              shape="rectangular"
              width={300}
            />
          )}
        </div>
      </div>
    </div>
  );
}
