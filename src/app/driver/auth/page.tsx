'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { DriverAuth } from '@/components/driver/auth'

export default function DriverAuthPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/driver')
    }
  }, [isAuthenticated, router])

  return <DriverAuth />
}
