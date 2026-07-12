'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { Feedback } from '@/components/driver/feedback/Feedback'

export default function DriverFeedbackPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!isAuthenticated || !user) {
      router.replace('/driver/auth')
    }
  }, [isAuthenticated, user, _hasHydrated, router])

  // FE-2: wait for Zustand rehydration before making any routing decision
  if (!_hasHydrated || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
      </div>
    )
  }

  return <Feedback onBack={() => router.push('/driver')} />
}
