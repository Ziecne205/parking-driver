'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePayDeposit } from '@/hooks/usePayDeposit'
import { PENDING_DEPOSIT_KEY } from '@/lib/constants'

/**
 * PayOS return route.
 * BE must set (PORT must match where parking-driver runs):
 *   payos.return-url  = <origin>/driver/payment/return
 *   payos.cancel-url  = <origin>/driver/payment/return?cancel=true
 *
 * Flow:
 *  1. Before redirecting to PayOS, DepositCheckout saves the reservationId in
 *     sessionStorage key "pending_deposit_reservation".
 *  2. PayOS redirects back here with ?code=00&orderCode=<paid> on success, or ?cancel=true.
 *  3. On success we call confirm-deposit, which verifies THAT orderCode with PayOS
 *     (the webhook can't reach a local BE). Only on confirm do we forward to my-bookings.
 *  4. If confirm fails we now SHOW the reason (instead of silently bouncing) and offer a
 *     retry — PayOS sometimes needs a few seconds to settle a just-paid transaction.
 */
export default function PaymentReturnPage() {
  const params = useSearchParams()
  const router = useRouter()
  const { mutate: confirmDeposit } = usePayDeposit()
  const started = useRef(false)
  // Held across retries so the button doesn't depend on sessionStorage (already cleared).
  const ctx = useRef<{ reservationId: string; orderCode?: string } | null>(null)
  const [phase, setPhase] = useState<'processing' | 'error'>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  const runConfirm = () => {
    if (!ctx.current) return
    const { reservationId, orderCode } = ctx.current
    setPhase('processing')
    confirmDeposit(
      { reservationId, orderCode },
      {
        onSuccess: () => {
          router.replace(`/driver/my-bookings?confirmed=${encodeURIComponent(reservationId)}`)
        },
        onError: (e) => {
          // Show the real backend reason (e.g. "trạng thái PayOS: PENDING") instead of hiding it.
          setErrorMsg(e?.message ?? 'Không xác nhận được thanh toán. Vui lòng thử lại.')
          setPhase('error')
        },
      }
    )
  }

  useEffect(() => {
    if (started.current) return
    started.current = true

    const reservationId = sessionStorage.getItem(PENDING_DEPOSIT_KEY)
    sessionStorage.removeItem(PENDING_DEPOSIT_KEY)

    const code = params.get('code')
    // PayOS returns the exact paid transaction's orderCode — verify THIS one, not the latest attempt.
    const orderCode = params.get('orderCode') ?? undefined
    // PayOS appends its OWN params to BOTH the return and cancel URLs — including `cancel=false`
    // on success. `params.get('cancel')` is therefore the string "true"/"false", and a bare
    // `if (cancel)` treats "false" as truthy, making every successful return look like a
    // cancellation and skip confirm-deposit (reservation stays Pending forever). Compare explicitly.
    const isCancelled = params.get('cancel') === 'true' || params.get('status') === 'CANCELLED'

    if (isCancelled) {
      router.replace('/driver/my-bookings')
      return
    }

    if (code === '00' && !reservationId) {
      // PayOS reported success but sessionStorage is empty — we lost the reservationId.
      // Almost always a PORT mismatch: parking-driver runs on a different port than the one in
      // payos.return-url, so this page loads on a different origin with empty sessionStorage.
      setErrorMsg(
        'Mất thông tin đặt chỗ (sessionStorage trống). Thường do parking-driver chạy ở port khác với port trong payos.return-url. Kiểm tra trạng thái trong "Đặt chỗ của tôi".'
      )
      setPhase('error')
      return
    }

    if (code === '00' && reservationId) {
      ctx.current = { reservationId, orderCode }
      runConfirm()
      return
    }

    router.replace('/driver/my-bookings')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="material-symbols-outlined text-red-600">error</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Chưa xác nhận được thanh toán</h1>
          <p className="mt-1 text-sm text-gray-600">{errorMsg}</p>
          <p className="mt-2 text-xs text-gray-400">
            Nếu bạn vừa thanh toán xong, cổng PayOS có thể cần vài giây để cập nhật — hãy bấm Thử lại.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={runConfirm}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => router.replace('/driver/my-bookings')}
              className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Về danh sách đặt chỗ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
        <p className="mt-4 text-sm text-gray-600">Đang xử lý kết quả thanh toán...</p>
      </div>
    </div>
  )
}
