'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store'
import { usePayDeposit } from '@/hooks/usePayDeposit'
import { useMyReservations } from '@/hooks/useMyReservations'
import { useCreatePayosLink, type PayosLink } from '@/hooks/usePayosLink'
import type { CreateReservationResult } from '@/hooks/useReservations'
import type { VehicleType, PaymentMethod } from '@/types/model'
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

  // Real PayOS QR — created once via react-query to avoid StrictMode double-fire.
  const { data: payos, isError, error } = useCreatePayosLink({
    type: 'DEPOSIT',
    id: reservation.reservationId,
  })

  // Poll for payment success every 1.5s (even in background)
  const { data: myRes, refetch, isRefetching } = useMyReservations(user?.id ?? '', {
    refetchInterval: 1500,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    const current = myRes?.find((r) => r.reservationId === reservation.reservationId)
    if (current && (current.status === 'Confirmed' || current.status === 'CheckedIn')) {
      toast.success('Thanh toán thành công!')
      onSuccess()
    }
  }, [myRes, reservation.reservationId, onSuccess])

  const vtName = vehicleTypes.find((v) => v.id === values.vehicleTypeId)?.name ?? values.vehicleTypeId

  // Xóa hàm handleConfirm giả lập thanh toán

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

      {/* Payment method */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Phương thức thanh toán</h2>
        
        {/* PayOS QR */}
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-gray-500">
            Quét mã QR bằng ứng dụng ngân hàng để thanh toán tiền cọc.
          </p>

          {payos ? (
            <>
              <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-xl p-3 shadow-sm flex items-center justify-center">
                <QRCodeSVG value={payos.qrCode} size={168} level="M" />
              </div>
              <a
                href={payos.checkoutUrl}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                Hoặc bấm vào đây để thanh toán qua cổng PayOS
              </a>
            </>
          ) : isError ? (
            <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-red-700">Lỗi tạo mã QR</p>
              <p className="text-xs text-red-600 mt-0.5">
                {error?.message ?? 'Đã xảy ra lỗi từ PayOS. Vui lòng thử lại.'}
              </p>
            </div>
          ) : (
            <div className="w-48 h-48 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
              <span className="text-xs">Đang tạo mã QR…</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pt-4">
        {isRefetching && (
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-2">
            <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
            <span>Đang kiểm tra thanh toán...</span>
          </div>
        )}
        <p className="text-xs text-gray-400 text-center">
          Hệ thống sẽ tự động chuyển trang khi nhận được thanh toán.
        </p>
      </div>
    </div>
  )
}
