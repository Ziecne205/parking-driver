'use client'

import type { VehicleType } from '@/types/model'
import { QRCodeSVG } from 'qrcode.react'
import type { BookFormValues } from './types'

interface ReadonlyBookingConfirmationProps {
  readonly reservationId: string
  readonly values: BookFormValues
  readonly vehicleTypes: VehicleType[]
  readonly depositAmount: number
  readonly onDone: () => void
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
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export function BookingConfirmation({
  reservationId,
  values,
  vehicleTypes,
  depositAmount,
  onDone,
}: ReadonlyBookingConfirmationProps) {
  const vtName = vehicleTypes.find((v) => v.id === values.vehicleTypeId)?.name ?? values.vehicleTypeId

  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
        <span
          className="material-symbols-outlined text-blue-600 text-[40px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Đặt chỗ thành công!</h1>
        <p className="text-base text-gray-500 mt-1">Chỗ đỗ xe của bạn đã được xác nhận.</p>
      </div>

      {/* Booking details card */}
      <div className="w-full bg-gray-50 rounded-xl p-5 border border-gray-200 relative overflow-hidden text-left">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-blue-400" />

        <div className="flex flex-col items-center mb-4">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-1">Mã Đặt Chỗ</span>
          <span className="text-lg font-bold text-blue-600 font-mono">#{reservationId}</span>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 inline-flex relative w-44 h-44 items-center justify-center">
            <QRCodeSVG value={reservationId} size={150} level="M" />
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-700 text-center">Mã QR để vào cổng</p>
        <p className="text-xs text-gray-400 text-center mt-0.5 mb-4">
          Vui lòng xuất trình mã này tại camera cổng vào
        </p>

        {/* Details */}
        <div className="flex flex-col gap-2 text-sm border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Loại xe</span>
            <span className="font-semibold text-gray-900">{vtName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Biển số</span>
            <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-900">
              {values.licensePlate}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Giờ vào</span>
            <span className="font-semibold text-gray-900">{formatDateTime(values.expectedEntryTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Giờ ra</span>
            <span className="font-semibold text-gray-900">{formatDateTime(values.expectedExitTime)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-800">Đã đặt cọc</span>
            <span className="font-bold text-blue-600">{formatVnd(depositAmount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <button
        type="button"
        onClick={onDone}
        className="w-full py-2.5 px-6 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition-colors shadow-sm"
      >
        Về trang chủ
      </button>
    </div>
  )
}
