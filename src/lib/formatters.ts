export function formatDuration(seconds: number): string {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTotalDuration(seconds: number): string {
  const total = Math.floor(seconds);
  if (total === 0) {return '';}

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const parts: string[] = [];
  if (hours > 0) {parts.push(`${hours}시간`);}
  if (minutes > 0) {parts.push(`${minutes}분`);}
  if (secs > 0) {parts.push(`${secs}초`);}

  return parts.join(' ');
}

export function getThumbnailUrl(thumbnail: string | { url: string; width: number; height: number } | undefined): string {
  if (!thumbnail) {return '';}
  if (typeof thumbnail === 'string') {return thumbnail;}
  return thumbnail.url || '';
}
