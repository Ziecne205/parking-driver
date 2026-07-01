'use client'

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { ReactNode, useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            // No global polling — only queries that need realtime data opt in via
            // their own refetchInterval (e.g. parking availability). Avoids spamming
            // the backend with repeated Users/Config/Pricing/Slot queries.
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
            retry: 1,
            throwOnError: false,
          },
        },
      })
  )

  const [mockingEnabled, setMockingEnabled] = useState(false)

  useEffect(() => {
    async function enableMocking() {
      // One switch: no NEXT_PUBLIC_API_BASE -> run MSW mocks; set it -> hit the real backend.
      if (!process.env.NEXT_PUBLIC_API_BASE) {
        const { initMocks } = await import('@/mocks')
        await initMocks()
      }
      setMockingEnabled(true)
    }

    enableMocking()
  }, [])

  if (!mockingEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Đang khởi tạo...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
