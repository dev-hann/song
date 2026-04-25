import { Home, Search, Library } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'search', label: '검색', icon: Search },
  { id: 'library', label: '라이브러리', icon: Library },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = tabs.find((t) => location.pathname.startsWith(`/${t.id}`))?.id || 'home';

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(`/${tab.id}`)}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full transition-colors',
              isActive ? 'text-white' : 'text-muted-foreground',
            )}
          >
            <Icon size={22} className={isActive ? 'fill-white' : ''} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
