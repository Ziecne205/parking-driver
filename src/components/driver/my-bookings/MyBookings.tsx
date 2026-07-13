'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, ListFilter, CheckCircle } from 'lucide-react'
import { useMyReservations } from '@/hooks/useMyReservations'
import { useCancelReservation } from '@/hooks/useReservations'
import type { ReservationStatus } from '@/types/model'
import { RESERVATION_STATUS_LABELS } from '@/types/model'
import { BookingCard } from './BookingCard'
import type { ReadonlyMyBookingsProps } from './types'

const ALL_STATUSES: Array<ReservationStatus | 'all'> = [
  'all', 'Pending', 'Confirmed', 'CheckedIn', 'Fulfilled', 'Cancelled', 'Expired',
]

const FILTER_LABELS: Record<ReservationStatus | 'all', string> = {
  all: 'Tất cả',
  ...RESERVATION_STATUS_LABELS,
}

export function MyBookings({ userId, onBack }: ReadonlyMyBookingsProps) {
  const [filter, setFilter] = useState<ReservationStatus | 'all'>('all')
  const [isPolling, setIsPolling] = useState(false)
  // ID of the reservation just paid — show a success banner and highlight it
  const [confirmedId, setConfirmedId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Read the PayOS return params from the initial URL exactly once, on mount.
  // This must NOT depend on `searchParams`: the router.replace below strips the query,
  // which would re-run the effect and fire its cleanup — cancelling the 10s stop-timer
  // and leaving the list polling every 2s forever. So we run it once and stop cleanly.
  useEffect(() => {
    const confirmed = searchParams.get('confirmed')
    const isReturn = !!confirmed || searchParams.has('code') || searchParams.has('cancel')
    if (!isReturn) return

    // `confirmed` is set by our own return page; ?code=/?cancel= are legacy raw PayOS params.
    if (confirmed) setConfirmedId(confirmed)
    setIsPolling(true)
    // Clean the URL so a refresh won't re-trigger the banner/poll.
    router.replace(pathname ?? '/driver/my-bookings')
    // Poll for up to 10s to pick up the BE status update, then stop.
    const timer = setTimeout(() => setIsPolling(false), 10000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: reservations = [], isLoading } = useMyReservations(userId, {
    refetchInterval: isPolling ? 2000 : undefined,
  })

  const { mutate: cancelReservation, isPending: isCancelling, variables: cancellingId } = useCancelReservation()

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === filter)

  // Sort by createdAt descending
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Đặt chỗ của tôi</h1>
          <span className="text-sm text-gray-400">{reservations.length} đặt chỗ</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Payment success banner — shown after returning from PayOS */}
        {confirmedId && (
          <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-4">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Thanh toán cọc thành công!</p>
              <p className="text-xs text-green-700 mt-0.5">
                Đặt chỗ #{confirmedId} đã được xác nhận. Trạng thái sẽ cập nhật trong giây lát.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmedId(null)}
              className="ml-auto text-green-500 hover:text-green-700"
              aria-label="Đóng thông báo"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        {/* Polling indicator */}
        {isPolling && (
          <div className="flex items-center gap-2 text-blue-600 text-sm px-1">
            <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
            <span>Đang cập nhật trạng thái đặt chỗ...</span>
          </div>
        )}

        {/* Filter chips */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <ListFilter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Lọc theo trạng thái</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  filter === s
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {FILTER_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Booking list */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white h-40 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">receipt_long</span>
            <p className="text-gray-500 text-sm">
              {filter === 'all' ? 'Bạn chưa có đặt chỗ nào.' : `Không có đặt chỗ ở trạng thái "${FILTER_LABELS[filter]}".`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((r) => (
              <BookingCard
                key={r.reservationId}
                reservation={r}
                onCancel={(id) => cancelReservation(id)}
                isCancelling={isCancelling && cancellingId === r.reservationId}
                highlighted={r.reservationId === confirmedId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
