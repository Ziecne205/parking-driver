'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { getQueryClient } from '@/lib/queryClient'

export function Providers({ children }: { children: ReactNode }) {
  // Use the module-level singleton so the Zustand logout action can call
  // getQueryClient().clear() from outside React (FE-8 fix).
  const queryClient = getQueryClient()

  // MSW is fully disabled — all requests go to the real backend defined by
  // NEXT_PUBLIC_API_BASE in .env.local. No mocking initialisation, no render gate.
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
