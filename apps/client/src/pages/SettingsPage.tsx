import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Monitor, Trash2, LogOut, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { APP_VERSION } from '@/constants';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }
      toast.success('캐시가 초기화되었습니다');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error('캐시 초기화에 실패했습니다');
      setClearing(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('로그아웃되었습니다');
  };

  return (
    <div className="pt-6 pb-4">
      <div className="px-4 flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full active:bg-accent"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">설정</h1>
      </div>

      <section className="px-4 mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          계정
        </h2>
        {isAuthenticated && user ? (
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-medium text-secondary-foreground">
                    {user.name[0]}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-secondary text-destructive text-sm font-medium active:opacity-80"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User size={18} className="text-muted" />
            </div>
            <p className="text-sm text-muted">로그인되지 않음</p>
          </div>
        )}
      </section>

      <section className="px-4 mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          테마
        </h2>
        <div className="bg-card rounded-xl p-2 flex gap-1">
          {[
            { value: 'light', label: '라이트', icon: Sun },
            { value: 'dark', label: '다크', icon: Moon },
            { value: 'system', label: '시스템', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors',
                theme === value
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted active:bg-secondary/50',
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          데이터
        </h2>
        <button
          onClick={handleClearCache}
          disabled={clearing}
          className="w-full bg-card rounded-xl p-4 flex items-center gap-3 active:opacity-80 disabled:opacity-50"
        >
          <Trash2 size={18} className="text-muted" />
          <div className="flex-1 text-left">
            <p className="text-sm text-card-foreground">캐시 초기화</p>
            <p className="text-xs text-muted">썸네일 및 임시 데이터 삭제</p>
          </div>
        </button>
      </section>

      <section className="px-4 mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          정보
        </h2>
        <div className="bg-card rounded-xl p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-card-foreground">버전</p>
            <p className="text-xs text-muted">{APP_VERSION}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
