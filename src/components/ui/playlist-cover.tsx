import Image from 'next/image';

interface PlaylistCoverProps {
  coverImage?: string | null;
  tracks?: { videoId: string; thumbnail?: string }[];
  size?: 'sm' | 'lg';
  className?: string;
}

export function PlaylistCover({ coverImage, tracks, size = 'lg', className }: PlaylistCoverProps) {
  const dimension = size === 'lg' ? 'w-48 h-48' : 'w-32 h-32';
  const imgSize = size === 'lg' ? 192 : 128;
  const thumbSize = size === 'lg' ? 96 : 64;

  return (
    <div className={`${dimension} mx-auto rounded-xl bg-surface flex items-center justify-center mb-4 overflow-hidden ${className ?? ''}`}>
      {coverImage ? (
        <Image
          src={coverImage}
          alt=""
          className="w-full h-full object-cover"
          unoptimized
          width={imgSize}
          height={imgSize}
        />
      ) : (
        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
          {tracks?.slice(0, 4).map((t) => (
            <div key={t.videoId} className="bg-surface-elevated overflow-hidden">
              {t.thumbnail && (
                <Image
                  src={t.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  unoptimized
                  width={thumbSize}
                  height={thumbSize}
                />
              )}
            </div>
          ))}
          {(!tracks || tracks.length < 4) &&
            Array.from({ length: Math.max(0, 4 - (tracks?.length ?? 0)) }).map((_, i) => (
              <div key={i} className="bg-surface-elevated" />
            ))}
        </div>
      )}
    </div>
  );
}
