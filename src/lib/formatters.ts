interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

/**
 * Formats video duration in seconds to MM:SS or HH:MM:SS format.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "00:08", "02:05", "01:01:01")
 */
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

/**
 * Extracts thumbnail URL from string or thumbnail object.
 *
 * @param thumbnail - Thumbnail as string or object
 * @returns Thumbnail URL string, or empty string if invalid
 */
export function getThumbnailUrl(thumbnail: string | Thumbnail | undefined): string {
  if (!thumbnail) return '';
  if (typeof thumbnail === 'string') return thumbnail;
  return thumbnail.url || '';
}
