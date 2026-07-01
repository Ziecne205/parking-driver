import { QueryClient } from '@tanstack/react-query'

// Module-level singleton so the Zustand auth store can call queryClient.clear()
// on logout without needing to be inside a React component.
// Providers.tsx must use this same instance (import and pass to QueryClientProvider).
let _queryClient: QueryClient | null = null

export function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          refetchOnWindowFocus: true,
          refetchOnMount: true,
          refetchOnReconnect: true,
          retry: 1,
          throwOnError: false,
        },
      },
    })
  }
  return _queryClient
}
