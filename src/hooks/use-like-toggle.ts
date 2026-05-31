import type { Audio } from '@/types';
import { useLikeCheck, useToggleLike } from '@/queries';

export function useLikeToggle(audio: Audio | null) {
  const { data: likeData } = useLikeCheck(audio?.id ?? null);
  const toggleLike = useToggleLike();

  const handleLike = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!audio || toggleLike.isPending) {return;}
    toggleLike.mutate({
      track: {
        videoId: audio.id,
        title: audio.title,
        channel: audio.channel.name,
        thumbnail: audio.thumbnail,
        duration: audio.duration,
      },
      isLiked: likeData?.liked ?? false,
    });
  };

  return {
    isLiked: likeData?.liked ?? false,
    isPending: toggleLike.isPending,
    toggle: handleLike,
  };
}
