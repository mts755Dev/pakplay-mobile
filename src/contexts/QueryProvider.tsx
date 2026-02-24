import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 seconds - same as web version
            gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime in v5)
            retry: 2,
            refetchOnWindowFocus: false, // Mobile doesn't need this
            refetchOnReconnect: true, // Refetch when network reconnects
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
