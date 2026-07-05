'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePayDeposit } from '@/hooks/usePayDeposit'
import { PENDING_DEPOSIT_KEY } from '@/lib/constants'

/**
 * PayOS return route.
 * BE must set:
 *   payos.return-url  = <origin>/driver/payment/return
 *   payos.cancel-url  = <origin>/driver/payment/return?cancel=true
 *
 * Flow:
 *  1. Before redirecting to PayOS, DepositCheckout saves the reservationId in
 *     sessionStorage key "pending_deposit_reservation".
 *  2. PayOS redirects back here with ?code=00 on success or ?cancel=true on cancel.
 *  3. On success we call POST /confirm-deposit ourselves (synchronously verifies with
 *     PayOS) instead of trusting the async webhook, which can't reach a local/dev BE
 *     and would otherwise leave the reservation stuck on Pending forever. Only after
 *     that confirms do we forward to /driver/my-bookings?confirmed=<id> for the banner.
 *  4. On cancel, or if confirm-deposit fails, we go back to my-bookings without the banner.
 */
export default function PaymentReturnPage() {
  const params = useSearchParams()
  const router = useRouter()
  const { mutate: confirmDeposit } = usePayDeposit()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const reservationId = sessionStorage.getItem(PENDING_DEPOSIT_KEY)
    // Clean up regardless of outcome
    sessionStorage.removeItem(PENDING_DEPOSIT_KEY)

    const cancel = params.get('cancel')
    const code = params.get('code')

    if (cancel) {
      router.replace('/driver/my-bookings')
      return
    }

    if (code === '00' && reservationId) {
      confirmDeposit(
        { reservationId },
        {
          onSuccess: () => {
            router.replace(`/driver/my-bookings?confirmed=${encodeURIComponent(reservationId)}`)
          },
          onError: () => {
            // Verification with PayOS failed (or not paid yet) — no false success banner.
            router.replace('/driver/my-bookings')
          },
        }
      )
      return
    }

    // Fallback — any other PayOS code or missing reservationId
    router.replace('/driver/my-bookings')
  }, [params, router, confirmDeposit])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
        <p className="mt-4 text-sm text-gray-600">Đang xử lý kết quả thanh toán...</p>
      </div>
    </div>
  )
}
