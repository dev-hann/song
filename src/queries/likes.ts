import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchLikes, addLike, removeLike, checkLike } from '@/services/api';
import type { Like } from '@/types';

export function useLikes() {
  return useQuery({
    queryKey: queryKeys.likes.all(),
    queryFn: fetchLikes,
    staleTime: STALE_TIME.LIKES,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useLikeCheck(videoId: string | null) {
  return useQuery({
    queryKey: queryKeys.likes.check(videoId ?? ''),
    queryFn: () => {
      if (!videoId) { throw new Error('No video ID'); }
      return checkLike(videoId);
    },
    enabled: !!videoId,
    staleTime: STALE_TIME.LIKES,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useToggleLike() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ track, isLiked }: { track: { videoId: string; title: string; channel: string; thumbnail: string; duration: number }; isLiked: boolean }) => {
      if (isLiked) {
        await removeLike(track.videoId);
      } else {
        await addLike(track);
      }
    },
    onMutate: async ({ track, isLiked }) => {
      await qc.cancelQueries({ queryKey: queryKeys.likes.all() });
      const previous = qc.getQueryData<Like[]>(queryKeys.likes.all());

      if (previous) {
        if (isLiked) {
          qc.setQueryData(queryKeys.likes.all(), previous.filter(l => l.videoId !== track.videoId));
        } else {
          qc.setQueryData(queryKeys.likes.all(), [{ ...track, likedAt: new Date().toISOString() }, ...previous]);
        }
      }

      qc.setQueryData(queryKeys.likes.check(track.videoId), { videoId: track.videoId, liked: !isLiked });

      return { previous };
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.likes.all(), context.previous);
      }
      qc.setQueryData(queryKeys.likes.check(vars.track.videoId), { videoId: vars.track.videoId, liked: vars.isLiked });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.likes.all() }),
  });
}
