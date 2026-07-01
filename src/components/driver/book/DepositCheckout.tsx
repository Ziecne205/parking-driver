'use client'

import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store'
import { useMyReservations } from '@/hooks/useMyReservations'
import { useCreatePayosLink } from '@/hooks/usePayosLink'
import type { CreateReservationResult } from '@/hooks/useReservations'
import type { VehicleType } from '@/types/model'
import type { BookFormValues } from './types'

interface ReadonlyDepositCheckoutProps {
  readonly reservation: CreateReservationResult
  readonly values: BookFormValues
  readonly vehicleTypes: VehicleType[]
  readonly onSuccess: () => void
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
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

export function DepositCheckout({
  reservation,
  values,
  vehicleTypes,
  onSuccess,
}: ReadonlyDepositCheckoutProps) {
  const { user } = useAuthStore()

  // FE-4: guard so onSuccess / toast fire exactly once even while polling continues
  const successFired = useRef(false)

  const { data: payos, isError, error, isLoading: isPayosLoading } = useCreatePayosLink({
    type: 'DEPOSIT',
    id: reservation.reservationId,
  })

  // Poll for payment confirmation every 3s.
  // When the user pays via the PayOS link (opens in same tab or new tab), the BE
  // webhook marks the reservation Confirmed. This poll detects it and advances the wizard.
  const { data: myRes, isRefetching } = useMyReservations(user?.id ?? '', {
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (successFired.current) return
    // Reservation model uses string IDs; createResult uses numeric — compare via String()
    const current = myRes?.find((r) => r.reservationId === String(reservation.reservationId))
    if (current && (current.status === 'Confirmed' || current.status === 'CheckedIn')) {
      successFired.current = true
      toast.success('Thanh toán thành công!')
      onSuccess()
    }
  }, [myRes, reservation.reservationId, onSuccess])

  const vtName = vehicleTypes.find((v) => v.id === values.vehicleTypeId)?.name ?? values.vehicleTypeId

  // Store reservationId in sessionStorage so the /payment/return page can signal
  // success back even after a full-page PayOS redirect.
  function handleOpenPayos() {
    if (!payos) return
    sessionStorage.setItem('pending_deposit_reservation', String(reservation.reservationId))
    window.location.href = payos.checkoutUrl
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">receipt_long</span>
          Tóm tắt đặt chỗ
        </h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Loại xe</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">directions_car</span>
              {vtName}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Biển số</span>
            <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-900">
              {values.licensePlate}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Giờ vào</span>
            <span className="font-semibold text-gray-900">{formatDateTime(values.expectedEntryTime)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Giờ ra</span>
            <span className="font-semibold text-gray-900">{formatDateTime(values.expectedExitTime)}</span>
          </div>
          <div className="mt-2 bg-blue-50 rounded-lg p-3 flex justify-between items-center border border-blue-100">
            <span className="font-semibold text-gray-800">Tiền đặt cọc:</span>
            <span className="text-xl font-bold text-blue-600">
              {formatVnd(reservation.depositAmount)}
            </span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            * Số tiền cọc sẽ được trừ vào tổng phí khi kết thúc phiên đỗ.
          </p>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Thanh toán cọc</h2>

        {isPayosLoading ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <span className="material-symbols-outlined text-4xl text-blue-400 animate-spin">sync</span>
            <p className="text-sm text-gray-500">Đang tạo liên kết thanh toán...</p>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-red-700">Không thể tạo liên kết thanh toán</p>
            <p className="text-xs text-red-600 mt-0.5">
              {error?.message ?? 'Lỗi từ cổng thanh toán. Vui lòng thử lại.'}
            </p>
          </div>
        ) : payos ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-600 text-center">
              Nhấn nút bên dưới để thanh toán qua cổng PayOS.
              Trang sẽ tự động cập nhật sau khi thanh toán thành công.
            </p>
            <button
              type="button"
              onClick={handleOpenPayos}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
              Thanh toán {formatVnd(reservation.depositAmount)} qua PayOS
            </button>
            <p className="text-xs text-gray-400 text-center">
              Sau khi thanh toán, quay lại trang này — hệ thống sẽ tự xác nhận.
            </p>
          </div>
        ) : null}
      </div>

      {/* Polling indicator */}
      <div className="flex flex-col items-center gap-2 pt-2">
        {isRefetching && (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
            <span>Đang kiểm tra trạng thái thanh toán...</span>
          </div>
        )}
        <p className="text-xs text-gray-400 text-center">
          Hệ thống tự động chuyển sang bước xác nhận khi nhận được thanh toán.
        </p>
      </div>
    </div>
  )
}
