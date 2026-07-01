'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { MyBookings } from '@/components/driver/my-bookings'

export default function DriverMyBookingsPage() {
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

  return <MyBookings userId={user.id} onBack={() => router.push('/driver')} />
}
