'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { BookFlow } from '@/components/driver/book'

/**
 * Driver booking route — standalone driver area (NOT the staff/manager DashboardLayout).
 * Guards for an authenticated Driver and threads the auth userId into the reservation.
 */
export default function DriverBookPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/driver/auth')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
      </div>
    )
  }

  return <BookFlow userId={user.id} onDone={() => router.push('/driver')} />
}
