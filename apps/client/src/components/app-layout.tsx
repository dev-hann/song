import { BottomNav } from '@/components/bottom-nav';
import { PlayerBar } from '@/components/player-bar';
import { FullPlayer } from '@/components/full-player';
import { QueueSheet } from '@/components/ui/queue-sheet';
import { useAudioStore } from '@/store';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { audio, showFullPlayer, setShowFullPlayer } = useAudioStore();
  const [showQueue, setShowQueue] = useState(false);

  return (
    <>
      <div className="content">{children}</div>
      <PlayerBar />
      {audio && (
        <FullPlayer
          show={showFullPlayer}
          onClose={() => setShowFullPlayer(false)}
          onOpenQueue={() => setShowQueue(true)}
        />
      )}
      <QueueSheet open={showQueue} onOpenChange={setShowQueue} />
      <BottomNav />
    </>
  );
}
