'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { DriverAuth } from '@/components/driver/auth'

export default function DriverAuthPage() {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (!_hasHydrated) return
    if (isAuthenticated) {
      router.replace('/driver')
    }
  }, [isAuthenticated, _hasHydrated, router])

  // FE-2: wait for Zustand rehydration before making any routing decision
  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
      </div>
    )
  }

  return <DriverAuth />
}
