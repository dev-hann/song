import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchHistory, addToHistory, clearHistory } from '@/services/api';

export function useHistory(limit = 100) {
  return useQuery({
    queryKey: queryKeys.history.all(),
    queryFn: () => fetchHistory(limit),
    staleTime: STALE_TIME.HISTORY,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAddToHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addToHistory,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.history.all() }),
  });
}

export function useClearHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearHistory,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.history.all() }),
  });
}
