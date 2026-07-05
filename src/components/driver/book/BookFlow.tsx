'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store'
import { useVehicleTypes } from '@/hooks/useAvailability'
import { useCancelReservation, type CreateReservationResult } from '@/hooks/useReservations'
import { queryKeys } from '@/lib/constants'
import { BookForm } from './BookForm'
import { DepositCheckout } from './DepositCheckout'
import type { BookStep, BookFormValues } from './types'

interface ReadonlyBookFlowProps {
  readonly userId?: string
}

// The wizard ends at 'payment': paying redirects out to PayOS, and the deposit is
// confirmed on /driver/payment/return, which lands the user on my-bookings with a
// success banner. So there is no in-wizard 'confirmation' step to reach.
const STEPS: { key: BookStep; label: string }[] = [
  { key: 'form', label: 'Chọn chỗ' },
  { key: 'payment', label: 'Thanh toán' },
]

export function BookFlow({ userId }: ReadonlyBookFlowProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const queryClient = useQueryClient()
  const { mutateAsync: cancelReservation } = useCancelReservation()

  const [step, setStep] = useState<BookStep>('form')
  const [createResult, setCreateResult] = useState<CreateReservationResult | null>(null)
  const [formValues, setFormValues] = useState<BookFormValues | null>(null)
  const [isBackingOut, setIsBackingOut] = useState(false)

  const { data: vehicleTypes = [] } = useVehicleTypes()

  const currentIndex = STEPS.findIndex((s) => s.key === step)

  // FE-3: cancel the dangling Pending reservation and clear its PayOS cache entry
  // before letting the user go back to the booking form.
  async function handleBackToForm() {
    if (createResult?.reservationId) {
      setIsBackingOut(true)
      try {
        await cancelReservation(createResult.reservationId)
      } catch {
        // Cancellation best-effort — don't block the user
      }
      queryClient.removeQueries({ queryKey: queryKeys.payosLink('DEPOSIT', createResult.reservationId) })
      setIsBackingOut(false)
    }
    setCreateResult(null)
    setFormValues(null)
    setStep('form')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm w-full z-10 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/driver"
            className="text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center p-2 rounded-full"
            title="Trang chủ"
          >
            <span className="material-symbols-outlined">home</span>
          </Link>
          {step !== 'form' && step !== 'confirmation' && (
            <button
              type="button"
              onClick={handleBackToForm}
              disabled={isBackingOut}
              className="text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center p-2 rounded-full -ml-2 disabled:opacity-50"
              title="Quay lại"
            >
              {isBackingOut
                ? <span className="material-symbols-outlined animate-spin">sync</span>
                : <span className="material-symbols-outlined">arrow_back</span>
              }
            </button>
          )}
          <Link href="/driver" className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors">
            ParkFlow Pro
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Bước {currentIndex + 1}/{STEPS.length}
          </span>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
              {user?.fullName}
            </span>
            <button
              type="button"
              onClick={() => {
                logout()
                router.replace('/driver/auth')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline-block">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 md:px-8 py-6">
        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto mb-6">
          <div className="flex items-center justify-between relative">
            {/* Track */}
            <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 rounded-full -z-10" />
            {/* Fill */}
            <div
              className="absolute top-4 left-0 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-300"
              style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((s, i) => {
              const done = i < currentIndex
              const active = i === currentIndex
              return (
                <div key={s.key} className="flex flex-col items-center gap-1 bg-gray-50 px-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      done
                        ? 'bg-blue-600 text-white'
                        : active
                        ? 'bg-blue-600 text-white shadow-[0_0_0_4px_#dbeafe]'
                        : 'bg-gray-200 text-gray-500 border-2 border-gray-200'
                    }`}
                  >
                    {done ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      active ? 'text-blue-600 font-bold' : done ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        {step === 'form' && (
          <BookForm
            userId={userId}
            onSuccess={(result, values) => {
              setCreateResult(result)
              setFormValues(values)
              setStep('payment')
            }}
          />
        )}

        {step === 'payment' && createResult && formValues && (
          <DepositCheckout
            reservation={createResult}
            values={formValues}
            vehicleTypes={vehicleTypes}
          />
        )}
      </main>
    </div>
  )
}
