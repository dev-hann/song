'use client';

import { Play, Pause, X } from 'lucide-react';
import Image from 'next/image';
import { formatDuration } from '@/lib/formatters';
import { ControlButton } from './ui/control-button';

interface AudioMetadata {
  id?: string;
  title: string;
  thumbnail?: string | { url: string; width: number; height: number };
  channel?: {
    id?: string;
    name: string;
    thumbnail?: string | { url: string; width: number; height: number };
  };
  duration?: number;
  currentTime?: number;
}

interface PlayerBarProps {
  audio: AudioMetadata | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

/**
 * Bottom player bar component showing current audio playback.
 * Displays thumbnail, title, channel, duration, and playback controls.
 */
export function PlayerBar({ audio, isPlaying, onTogglePlay, onClose }: PlayerBarProps) {
  if (!audio) return null;

  return (
    <div className="player-bar active">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
          {audio.thumbnail && (
            <Image
              src={typeof audio.thumbnail === 'string' ? audio.thumbnail : audio.thumbnail.url}
              alt={audio.title}
              fill
              className="object-cover"
              sizes="48px"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{audio.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {audio.channel?.thumbnail && (
              <div className="relative w-4 h-4 flex-shrink-0 rounded-full overflow-hidden">
                <Image
                  src={typeof audio.channel.thumbnail === 'string' ? audio.channel.thumbnail : audio.channel.thumbnail.url}
                  alt={audio.channel.name}
                  fill
                  className="object-cover"
                  sizes="16px"
                />
              </div>
            )}
            <p className="text-xs text-zinc-400 truncate">{audio.channel?.name}</p>
            {audio.duration && (
              <>
                <span className="text-zinc-600">•</span>
                <p className="text-xs text-zinc-400">
                  {audio.currentTime !== undefined ? formatDuration(audio.currentTime) : '0:00'} / {formatDuration(audio.duration)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ControlButton variant="icon" onClick={onClose}>
          <X size={20} />
        </ControlButton>
        <ControlButton variant="icon" onClick={onTogglePlay}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </ControlButton>
      </div>
    </div>
  );
}
