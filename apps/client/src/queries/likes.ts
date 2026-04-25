import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { fetchLikes, addLike, removeLike, checkLike } from '@/services/api';
import type { Like } from '@/types';

export function useLikes() {
  return useQuery({
    queryKey: queryKeys.likes.all(),
    queryFn: fetchLikes,
    staleTime: 30 * 1000,
  });
}

export function useLikeCheck(videoId: string | null) {
  return useQuery({
    queryKey: queryKeys.likes.check(videoId || ''),
    queryFn: () => checkLike(videoId!),
    enabled: !!videoId,
    staleTime: 30 * 1000,
  });
}

export function useToggleLike() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ track, isLiked }: { track: { video_id: string; title: string; channel: string; thumbnail: string; duration: number }; isLiked: boolean }) => {
      if (isLiked) {
        await removeLike(track.video_id);
      } else {
        await addLike(track);
      }
    },
    onMutate: async ({ track, isLiked }) => {
      await qc.cancelQueries({ queryKey: queryKeys.likes.all() });
      const previous = qc.getQueryData<Like[]>(queryKeys.likes.all());

      if (previous) {
        if (isLiked) {
          qc.setQueryData(queryKeys.likes.all(), previous.filter(l => l.video_id !== track.video_id));
        } else {
          qc.setQueryData(queryKeys.likes.all(), [{ ...track, liked_at: new Date().toISOString() }, ...previous]);
        }
      }

      qc.setQueryData(queryKeys.likes.check(track.video_id), { video_id: track.video_id, liked: !isLiked });

      return { previous };
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.likes.all(), context.previous);
      }
      qc.setQueryData(queryKeys.likes.check(vars.track.video_id), { video_id: vars.track.video_id, liked: vars.isLiked });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.likes.all() });
    },
  });
}
