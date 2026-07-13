'use client'

import { useEffect } from 'react'
import { useCreatePayosLink } from '@/hooks/usePayosLink'
import { usePricing } from '@/hooks/useAvailability'
import type { CreateReservationResult } from '@/hooks/useReservations'
import type { VehicleType } from '@/types/model'
import { PENDING_DEPOSIT_KEY } from '@/lib/constants'
import { estimateParkingFee, findPricingForVehicle } from '@/lib/pricing'
import type { BookFormValues } from './types'

interface ReadonlyDepositCheckoutProps {
  readonly reservation: CreateReservationResult
  readonly values: BookFormValues
  readonly vehicleTypes: VehicleType[]
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
}: ReadonlyDepositCheckoutProps) {
  const { data: payos, isError, error, isLoading: isPayosLoading } = useCreatePayosLink({
    type: 'DEPOSIT',
    id: reservation.reservationId,
  })

  // Surface the real reason in the console — the on-screen card only shows a short
  // message, and this flow is easy to misdiagnose (403 role vs. PayOS config vs. gateway).
  useEffect(() => {
    if (isError) {
      console.error('[PayOS] Không thể tạo liên kết thanh toán:', error)
    }
  }, [isError, error])

  const matchedVehicleName = vehicleTypes.find((v) => v.id === values.vehicleTypeId)?.name
  const vtName = matchedVehicleName ?? values.vehicleTypeId

  const { data: pricing = [] } = usePricing()
  const feePolicy = findPricingForVehicle(pricing, matchedVehicleName)
  const feeEstimate = feePolicy
    ? estimateParkingFee(feePolicy, values.expectedEntryTime, values.expectedExitTime)
    : null

  // Store reservationId so /driver/payment/return — the single place that confirms the
  // deposit — can pick it up after the full-page PayOS redirect. No polling here: the
  // return page is the one authority that flips the reservation to Confirmed and shows
  // the success banner on my-bookings.
  function handleOpenPayos() {
    if (!payos) return
    sessionStorage.setItem(PENDING_DEPOSIT_KEY, reservation.reservationId)
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
          {feeEstimate && (
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Ước tính phí đỗ</span>
              <span className="font-semibold text-gray-900">
                {formatVnd(feeEstimate.total)}
                <span className="text-xs font-normal text-gray-400"> (~{feeEstimate.billableHours} giờ)</span>
              </span>
            </div>
          )}
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
    </div>
  )
}
