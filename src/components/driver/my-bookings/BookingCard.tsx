'use client'

import { useState } from 'react'
import { Calendar, Clock, Car, MapPin, AlertTriangle, X, CreditCard } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { RESERVATION_STATUS_LABELS } from '@/types/model'
import { PENDING_DEPOSIT_KEY } from '@/lib/constants'
import type { PayosLink } from '@/hooks/usePayosLink'
import type { ReadonlyBookingCardProps } from './types'

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  CheckedIn: 'bg-green-50 text-green-700 border-green-200',
  Fulfilled: 'bg-gray-50 text-gray-600 border-gray-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
}

const CANCELLABLE_STATUSES = new Set(['Pending', 'Confirmed'])

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

export function BookingCard({ reservation, onCancel, isCancelling, highlighted = false }: ReadonlyBookingCardProps) {
  const [showQr, setShowQr] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const createLink = useMutation({
    mutationFn: (reservationId: string) =>
      api.post<PayosLink>('/driver/payments/payos/create-link', {
        type: 'DEPOSIT',
        id: Number(reservationId), // reservationId is a string in the Reservation model
      }),
    onSuccess: (res, reservationId) => {
      // Bridge reservationId to /driver/payment/return (same as DepositCheckout) so the return
      // page can confirm the deposit after the PayOS redirect. Without this, paying from the
      // bookings list leaves the reservation stuck on Pending forever.
      sessionStorage.setItem(PENDING_DEPOSIT_KEY, reservationId)
      window.location.href = res.checkoutUrl
    }
  })

  const canCancel = CANCELLABLE_STATUSES.has(reservation.status)
  // FE-7: enforce 3-hour pre-entry cancellation policy on the FE to give clear
  // feedback before the request hits the BE.
  const hoursUntilEntry =
    (new Date(reservation.expectedEntryTime).getTime() - Date.now()) / 3_600_000
  const cancelBlockedByTime = canCancel && hoursUntilEntry < 3
  const statusStyle = STATUS_STYLES[reservation.status] ?? STATUS_STYLES.Fulfilled
  const statusLabel = RESERVATION_STATUS_LABELS[reservation.status] ?? reservation.status

  const handleCancelConfirm = () => {
    onCancel(reservation.reservationId)
    setShowCancelConfirm(false)
  }

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${
      highlighted ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'
    }`}>
      {/* Top accent bar by status */}
      <div
        className={`h-1 w-full ${
          reservation.status === 'Confirmed' || reservation.status === 'CheckedIn'
            ? 'bg-blue-500'
            : reservation.status === 'Pending'
            ? 'bg-yellow-400'
            : reservation.status === 'Fulfilled'
            ? 'bg-green-500'
            : 'bg-gray-300'
        }`}
      />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <span className="text-xs text-gray-400 font-mono uppercase tracking-wide">Mã đặt chỗ</span>
            <div className="flex items-center gap-2">
              <p className="font-mono font-bold text-blue-600 text-sm">#{reservation.reservationId}</p>
              <span className="text-[10px] text-gray-400">
                ({formatDateTime(reservation.createdAt)})
              </span>
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{reservation.vehicleTypeName ?? 'Tòa nhà gửi xe'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-mono font-medium">{reservation.licensePlate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{formatDateTime(reservation.expectedEntryTime)}</span>
            <span className="text-gray-400">→</span>
            <span>{formatDateTime(reservation.expectedExitTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500">Cọc: <span className="font-semibold text-gray-700">{formatVnd(reservation.depositAmount)}</span></span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {(reservation.status === 'Confirmed' || reservation.status === 'CheckedIn') && (
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="flex-1 rounded-lg border border-blue-200 bg-blue-50 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">qr_code_2</span>
              Mã QR vào cổng
            </button>
          )}
          {reservation.status === 'Pending' && (
            <button
              type="button"
              onClick={() => createLink.mutate(reservation.reservationId)}
              disabled={createLink.isPending}
              className="flex-1 rounded-lg border border-transparent bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {createLink.isPending ? 'Đang mở...' : 'Thanh toán ngay'}
            </button>
          )}
          {canCancel && (
            <div className="relative flex-1 group">
              <button
                type="button"
                onClick={() => !cancelBlockedByTime && setShowCancelConfirm(true)}
                disabled={isCancelling || cancelBlockedByTime}
                aria-disabled={cancelBlockedByTime}
                className="w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Hủy đặt chỗ
              </button>
              {cancelBlockedByTime && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white text-center shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  Không thể hủy trong vòng 3 giờ trước giờ vào
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Mã QR vào cổng"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Mã QR vào cổng</h3>
              <button
                type="button"
                onClick={() => setShowQr(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              {/* QR Code */}
              <div className="w-48 h-48 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center p-2">
                <QRCodeSVG value={reservation.reservationId} size={170} level="M" />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Xuất trình mã này tại camera cổng vào
              </p>
              <p className="font-mono text-sm font-bold text-blue-600">#{reservation.reservationId}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận hủy đặt chỗ"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Hủy đặt chỗ?</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Khoản cọc <span className="font-semibold text-red-600">{formatVnd(reservation.depositAmount)}</span> sẽ không được hoàn lại.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={isCancelling}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
