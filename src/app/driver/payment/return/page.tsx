'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

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
 *  3. On success we forward to /driver/my-bookings?confirmed=<id> so MyBookings
 *     can show a success banner and the updated status.
 *  4. On cancel we go straight back to my-bookings without the banner.
 */
export default function PaymentReturnPage() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const reservationId = sessionStorage.getItem('pending_deposit_reservation')
    // Clean up regardless of outcome
    sessionStorage.removeItem('pending_deposit_reservation')

    const cancel = params.get('cancel')
    const code = params.get('code')

    if (cancel) {
      router.replace('/driver/my-bookings')
      return
    }

    if (code === '00' && reservationId) {
      // Payment confirmed — go to my-bookings with a confirmed flag so it shows a banner
      router.replace(`/driver/my-bookings?confirmed=${encodeURIComponent(reservationId)}`)
      return
    }

    // Fallback — any other PayOS code or missing reservationId
    router.replace('/driver/my-bookings')
  }, [params, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
        <p className="mt-4 text-sm text-gray-600">Đang xử lý kết quả thanh toán...</p>
      </div>
    </div>
  )
}
