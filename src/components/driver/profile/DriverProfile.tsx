'use client'

import { ArrowLeft } from 'lucide-react'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { AccountForm } from './AccountForm'
import type { ReadonlyDriverProfileProps } from './types'

export function DriverProfile({ userId, onBack }: ReadonlyDriverProfileProps) {
  const { data: user, isLoading } = useProfile(userId)
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile(userId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    )
  }

  const initials = user.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Hồ sơ</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Avatar bento card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-5">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold select-none">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-gray-900 truncate">{user.fullName}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Account info form */}
        <AccountForm
          user={user}
          isSubmitting={isUpdating}
          onSubmit={(data) => updateProfile(data)}
        />
      </main>
    </div>
  )
}
