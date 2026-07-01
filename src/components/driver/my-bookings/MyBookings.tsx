'use client'

import { useState } from 'react'
import { ArrowLeft, ListFilter } from 'lucide-react'
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
  const { data: reservations = [], isLoading } = useMyReservations(userId)
  const { mutate: cancelReservation, isPending: isCancelling, variables: cancellingId } = useCancelReservation()

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === filter)

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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">receipt_long</span>
            <p className="text-gray-500 text-sm">
              {filter === 'all' ? 'Bạn chưa có đặt chỗ nào.' : `Không có đặt chỗ ở trạng thái "${FILTER_LABELS[filter]}".`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <BookingCard
                key={r.reservationId}
                reservation={r}
                onCancel={(id) => cancelReservation(id)}
                isCancelling={isCancelling && cancellingId === r.reservationId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
