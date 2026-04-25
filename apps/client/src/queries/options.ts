import type { UseQueryOptions } from '@tanstack/react-query';

export const commonQueryOptions: Partial<UseQueryOptions> = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
};

export const queryOptions = {
  search: {
    ...commonQueryOptions,
    staleTime: 5 * 60 * 1000,
  },

  audioInfo: {
    ...commonQueryOptions,
    staleTime: 10 * 60 * 1000,
  },

  audioStream: {
    ...commonQueryOptions,
    staleTime: 5 * 60 * 1000,
  },
} as const;
