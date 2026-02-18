'use client';

import Image from 'next/image';
import type { SearchResultAudio } from '@/types';
import { getThumbnailUrl } from '@/lib/formatters';

interface AudioCardProps {
  audio: SearchResultAudio;
  onClick: (audioId: string) => void;
}

/**
 * Audio card component displaying thumbnail, title, channel, and duration.
 * Clickable to play the audio.
 */
export function AudioCard({ audio, onClick }: AudioCardProps) {
  return (
    <div
      className="bg-zinc-900/80 rounded-2xl overflow-hidden active:scale-98 transition-transform cursor-pointer"
      onClick={() => onClick(audio.id)}
    >
      <div className="relative aspect-video bg-zinc-800">
        {audio.thumbnail && (
          <Image
            src={getThumbnailUrl(audio.thumbnail)}
            alt={audio.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
        {audio.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md font-medium">
            {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>
      <div className="p-3 flex gap-3">
        {audio.channel?.thumbnail && (
          <Image
            src={getThumbnailUrl(audio.channel.thumbnail)}
            alt={audio.channel.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 mb-1">
            {audio.title}
          </h3>
          <p className="text-xs text-zinc-400 truncate">
            {audio.channel?.name}
          </p>
        </div>
      </div>
    </div>
  );
}
