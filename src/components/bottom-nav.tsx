'use client';

import { Home, Search, Library } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * Bottom navigation bar with tab switching.
 * Provides navigation between home, search, and library screens.
 */
export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'search', label: '검색', icon: Search },
    { id: 'library', label: '라이브러리', icon: Library },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive ? 'text-white' : 'text-zinc-500'
            }`}
          >
            <Icon size={22} className={isActive ? 'fill-white' : ''} />
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
