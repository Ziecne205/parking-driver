'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { usePayDeposit } from '@/hooks/usePayDeposit'
import type { CreateReservationResult } from '@/hooks/useReservations'
import type { VehicleType, PaymentMethod } from '@/types/model'
import type { BookFormValues } from './types'

interface ReadonlyDepositCheckoutProps {
  readonly reservation: CreateReservationResult
  readonly values: BookFormValues
  readonly vehicleTypes: VehicleType[]
  readonly onSuccess: () => void
}

const METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'QR', label: 'Mã QR', icon: 'qr_code_scanner' },
  { id: 'Cash', label: 'Tiền mặt', icon: 'payments' },
]

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
  const [method, setMethod] = useState<PaymentMethod>('QR')
  const payDeposit = usePayDeposit()

  const vtName = vehicleTypes.find((v) => v.id === values.vehicleTypeId)?.name ?? values.vehicleTypeId

  const handleConfirm = async () => {
    try {
      await payDeposit.mutateAsync({
        reservationId: reservation.reservationId,
        paymentMethod: method,
      })
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message ?? 'Thanh toán thất bại')
    }
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

      {/* Payment method */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Phương thức thanh toán</h2>
        <div className="grid grid-cols-2 gap-3">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                method === m.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <span
                className={`material-symbols-outlined text-3xl ${
                  method === m.id ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {m.icon}
              </span>
              <span
                className={`text-sm font-medium ${
                  method === m.id ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {/* QR placeholder */}
        {method === 'QR' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-gray-500">
              Quét mã QR bằng ứng dụng ngân hàng để thanh toán.
            </p>
            <div className="w-44 h-44 bg-white border-2 border-gray-200 rounded-xl p-3 shadow-sm flex items-center justify-center relative">
              <div className="absolute top-2 left-2 w-7 h-7 border-t-4 border-l-4 border-blue-600 rounded-tl" />
              <div className="absolute top-2 right-2 w-7 h-7 border-t-4 border-r-4 border-blue-600 rounded-tr" />
              <div className="absolute bottom-2 left-2 w-7 h-7 border-b-4 border-l-4 border-blue-600 rounded-bl" />
              <div className="absolute bottom-2 right-2 w-7 h-7 border-b-4 border-r-4 border-blue-600 rounded-br" />
              <span className="material-symbols-outlined text-6xl text-gray-300">qr_code_2</span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              Đang chờ thanh toán...
            </p>
          </div>
        )}

        {method === 'Cash' && (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="material-symbols-outlined text-5xl text-green-500">payments</span>
            <p className="text-sm text-gray-500 text-center">
              Vui lòng thanh toán tiền mặt tại quầy thu phí. Nhấn xác nhận để hoàn tất đặt chỗ.
            </p>
          </div>
        )}
      </div>

      {/* Confirm button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={payDeposit.isPending}
          className="px-6 py-2 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {payDeposit.isPending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          {!payDeposit.isPending && (
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          )}
        </button>
      </div>
    </div>
  )
}
