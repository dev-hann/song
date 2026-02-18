'use client';

import { BottomNav } from "@/components/bottom-nav";
import { PlayerBar } from "@/components/player-bar";
import { useAudioStore } from '@/store';
import { useAudioStream } from '@/hooks/use-audio-stream';
import { AudioStatus } from '@/constants';
import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Main app layout component with navigation and player controls.
 * Wraps page content with bottom navigation and audio player.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { audio, playback, status, togglePlay, clearAudio, updatePlaybackTime, updatePlaybackDuration } = useAudioStore();
  const [activeTab, setActiveTab] = useState('home');
  const audioRef = useRef<HTMLAudioElement>(null);

  const isPlaying = status === AudioStatus.PLAYING;
  const { data: streamData } = useAudioStream(audio?.id ?? null) as { data: { url: string } | undefined };

  const handleTogglePlay = () => {
    togglePlay();
  };

  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    clearAudio();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Use window.location for navigation since this is a client component
    if (tab === 'home') window.location.href = '/';
    if (tab === 'search') window.location.href = '/search';
    if (tab === 'library') window.location.href = '/library';
  };

  // Update active tab based on current path
  useEffect(() => {
    const updateActiveTab = () => {
      const path = window.location.pathname;
      if (path.startsWith('/search')) setActiveTab('search');
      else if (path.startsWith('/library')) setActiveTab('library');
      else setActiveTab('home');
    };
    updateActiveTab();
  }, []);

  // Update document title based on playback state
  useEffect(() => {
    if (audio && isPlaying) {
      document.title = `재생 중: ${audio.title} - SONG`;
    } else {
      document.title = 'SONG - 광고 없는 영상 플레이어';
    }
  }, [audio, isPlaying]);

  // Muted trick: preempt playback permission when audioId changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio?.id) return;

    audio.muted = true;
    audio.play().catch(() => {});
  }, [audio?.id]);

  // Set stream URL when available
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamData?.url) return;

    audio.src = streamData.url;
    audio.load();

    const handleCanPlay = () => {
      audio.muted = false;
      if (audio.paused) {
        audio.play().catch(console.error);
      }
    };

    audio.addEventListener('canplay', handleCanPlay, { once: true });

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [streamData?.url]);

  // Toggle play/pause based on isPlaying state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      if (audio.readyState >= 2) {
        audio.play().catch(console.error);
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      updatePlaybackTime(Math.floor(audio.currentTime));
    };

    const handleLoadedMetadata = () => {
      updatePlaybackDuration(audio.duration);
    };

    const handleEnded = () => {
      // Handle track end logic here if needed
    };

    const handleError = () => {
      console.error('Audio playback error:', audio.error);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [updatePlaybackTime, updatePlaybackDuration]);

  return (
    <>
      <div className="content">{children}</div>

      <audio
        ref={audioRef}
        playsInline
        className="hidden"
      />

      <PlayerBar
        audio={audio ? { ...audio, currentTime: playback.currentTime } : null}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onClose={handleClose}
      />

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
}
