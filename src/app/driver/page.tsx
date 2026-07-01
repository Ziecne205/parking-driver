'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Car, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store'
import { Button } from '@/components/ui/button'

/**
 * Driver area landing — a standalone shell (NOT the staff/manager console DashboardLayout).
 */
export default function DriverHome() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()

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

  const navItems = [
    { label: 'Đặt chỗ', icon: 'local_parking', action: () => router.push('/driver/book'), enabled: true },
    { label: 'Đặt chỗ của tôi', icon: 'receipt_long', action: () => router.push('/driver/my-bookings'), enabled: true },
    { label: 'Hồ sơ', icon: 'account_circle', action: () => router.push('/driver/profile'), enabled: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">ParkFlow — Tài xế</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.fullName}</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              logout()
              router.replace('/driver/auth')
            }}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Chào {user.fullName}</h1>
        <p className="mt-1 text-sm text-gray-600">Khu vực dành cho tài xế. Chọn chức năng bên dưới.</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {navItems.map((item) =>
            item.enabled ? (
              <button
                key={item.label}
                onClick={item.action}
                className="flex flex-col items-center gap-2 rounded-xl border border-blue-200 bg-white p-5 text-center text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 transition-colors"
              >
                <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                {item.label}
              </button>
            ) : (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 cursor-not-allowed rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm font-medium text-gray-400"
              >
                <span className="material-symbols-outlined text-3xl text-gray-300">{item.icon}</span>
                {item.label}
                <div className="text-xs">Sắp ra mắt</div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )
}
