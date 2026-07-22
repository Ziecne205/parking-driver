'use client'

import { useState, type FormEvent } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useExtendReservation } from '@/hooks/useExtendReservation'
import type { Reservation } from '@/types/model'

interface ReadonlyExtendReservationDialogProps {
  readonly reservation: Reservation
  readonly onClose: () => void
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
}

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time, no timezone/seconds.
function toDateTimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ExtendReservationDialog({ reservation, onClose }: ReadonlyExtendReservationDialogProps) {
  const [newExitTime, setNewExitTime] = useState(() => toDateTimeLocal(reservation.expectedExitTime))
  const extend = useExtendReservation()

  const minLocal = toDateTimeLocal(reservation.expectedExitTime)
  const isAfterCurrent = new Date(newExitTime).getTime() > new Date(reservation.expectedExitTime).getTime()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAfterCurrent || extend.isPending) return
    extend.mutate({ reservationId: reservation.reservationId, newExitTime })
  }

  const result = extend.data

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Gia hạn đặt chỗ"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Gia hạn đặt chỗ</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Giờ ra hiện tại:{' '}
              <span className="font-medium text-gray-900">{formatDateTime(reservation.expectedExitTime)}</span>
            </p>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500">Giờ ra mới</span>
              <input
                type="datetime-local"
                value={newExitTime}
                min={minLocal}
                onChange={(e) => setNewExitTime(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
              />
            </label>

            {!isAfterCurrent && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Giờ ra mới phải sau giờ ra hiện tại.
              </p>
            )}

            <p className="text-xs text-gray-400">
              Thời gian gia hạn được tính phí riêng theo giá hiện hành — phí của khoảng thời gian đã
              đặt ban đầu giữ nguyên.
            </p>

            {extend.isError && (
              <p className="text-xs text-red-600">
                {extend.error?.message ?? 'Không thể gia hạn. Vui lòng thử lại.'}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!isAfterCurrent || extend.isPending}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {extend.isPending ? 'Đang gửi...' : 'Xác nhận gia hạn'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-sm text-gray-700">
              Đã gia hạn đến{' '}
              <span className="font-semibold text-gray-900">
                {formatDateTime(result.reservation.expectedExitTime)}
              </span>
            </p>

            <div className="w-full rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
              <p className="text-xs text-gray-500">Phí gia hạn (giá hiện hành)</p>
              <p className="text-xl font-bold text-blue-600">{formatVnd(result.payment.amount)}</p>
            </div>

            <a
              href={result.payment.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              Thanh toán qua PayOS
            </a>

            <p className="text-center text-xs text-gray-400">
              Chưa thanh toán ngay cũng không sao — khoản này sẽ được cộng vào tổng phí khi bạn ra
              cổng.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-1 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
