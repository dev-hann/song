'use client';

import { QueryClient, QueryClientProvider as RQProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 1000 * 60 * 5,
      },
    },
  }));

  return (
    <RQProvider client={queryClient}>
      {children}
    </RQProvider>
  );
}
