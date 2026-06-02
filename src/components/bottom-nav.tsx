"use client";

import { Home, Search, Library } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'search', label: '검색', icon: Search },
  { id: 'library', label: '라이브러리', icon: Library },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = tabs.find((t) => pathname.startsWith(`/${t.id}`))?.id ?? 'home';

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { router.push(`/${tab.id}`); }}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <Icon size={22} className={isActive ? 'fill-foreground' : ''} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
