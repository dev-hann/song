import { formatDuration } from '@/lib/formatters';
import type { SearchResultAudio } from '@/types';

interface AudioCardProps {
  audio: SearchResultAudio;
  onClick: (id: string) => void;
}

export function AudioCard({ audio, onClick }: AudioCardProps) {
  return (
    <div
      className="cursor-pointer"
      onClick={() => onClick(audio.id)}
    >
      <p>{audio.title}</p>
      <p>{audio.channel.name}</p>
      {audio.duration > 0 && (
        <span>{formatDuration(audio.duration)}</span>
      )}
    </div>
  );
}
