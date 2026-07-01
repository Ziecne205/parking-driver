'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useVehicleTypes, useAvailability } from '@/hooks/useAvailability'
import { useCreateReservation, type CreateReservationResult } from '@/hooks/useReservations'
import type { BookFormValues } from './types'

const schema = z
  .object({
    vehicleTypeId: z.string().min(1, 'Vui lòng chọn loại phương tiện'),
    licensePlate: z.string().min(1, 'Vui lòng nhập biển số xe'),
    expectedEntryTime: z.string().min(1, 'Vui lòng chọn giờ vào'),
    expectedExitTime: z.string().min(1, 'Vui lòng chọn giờ ra'),
  })
  .refine((d) => new Date(d.expectedExitTime) > new Date(d.expectedEntryTime), {
    message: 'Giờ ra phải sau giờ vào',
    path: ['expectedExitTime'],
  })

interface ReadonlyBookFormProps {
  readonly userId?: string
  readonly onSuccess: (result: CreateReservationResult, values: BookFormValues) => void
}

export function BookForm({ userId, onSuccess }: ReadonlyBookFormProps) {
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const createReservation = useCreateReservation()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleTypeId: '',
      licensePlate: '',
      expectedEntryTime: '',
      expectedExitTime: '',
    },
  })

  const selectedVehicleTypeId = watch('vehicleTypeId')
  const { data: availability } = useAvailability()

  const vehicleAvailability = availability?.byVehicleType.find((vt) => {
    const matchedType = vehicleTypes.find((v) => v.id === selectedVehicleTypeId)
    return vt.vehicleTypeName === matchedType?.name
  })

  const headroom = vehicleAvailability?.walkInHeadroom ?? null

  const onSubmit = async (values: BookFormValues) => {
    try {
      const result = await createReservation.mutateAsync({
        vehicleTypeId: values.vehicleTypeId,
        licensePlate: values.licensePlate.toUpperCase(),
        expectedEntryTime: new Date(values.expectedEntryTime).toISOString(),
        expectedExitTime: new Date(values.expectedExitTime).toISOString(),
        userId,
      })
      onSuccess(result, { ...values, licensePlate: values.licensePlate.toUpperCase() })
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      if (e?.code === 'QUOTA_FULL') {
        // no override for driver — just show locked message
        return
      }
      toast.error(e?.message ?? 'Đặt chỗ thất bại')
    }
  }

  const isQuotaFull =
    createReservation.isError && (createReservation.error as { code?: string })?.code === 'QUOTA_FULL'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Vehicle type */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-900">1. Loại Phương Tiện</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {vehicleTypes.map((vt) => (
            <label key={vt.id} className="cursor-pointer group">
              <input
                type="radio"
                value={vt.id}
                {...register('vehicleTypeId')}
                className="peer sr-only"
              />
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 bg-white peer-checked:border-blue-600 peer-checked:bg-blue-50 hover:bg-gray-50 transition-all">
                <span className="material-symbols-outlined text-4xl text-gray-400 peer-checked:text-blue-600 mb-1">
                  {vt.name === 'Ô tô' ? 'directions_car' : vt.name === 'Xe máy' ? 'two_wheeler' : 'local_shipping'}
                </span>
                <span className="text-sm font-medium text-gray-900">{vt.name}</span>
              </div>
            </label>
          ))}
        </div>
        {errors.vehicleTypeId && (
          <p className="text-sm text-red-600">{errors.vehicleTypeId.message}</p>
        )}
      </div>

      {/* Booking details */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-900">2. Chi Tiết Đặt Chỗ</h2>

        {/* Time and plate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="expectedEntryTime">
              Giờ Vào Dự Kiến
            </label>
            <input
              id="expectedEntryTime"
              type="datetime-local"
              {...register('expectedEntryTime')}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
            />
            {errors.expectedEntryTime && (
              <p className="text-sm text-red-600">{errors.expectedEntryTime.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="expectedExitTime">
              Giờ Ra Dự Kiến
            </label>
            <input
              id="expectedExitTime"
              type="datetime-local"
              {...register('expectedExitTime')}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
            />
            {errors.expectedExitTime && (
              <p className="text-sm text-red-600">{errors.expectedExitTime.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-900" htmlFor="licensePlate">
            Biển Số Xe
          </label>
          <input
            id="licensePlate"
            type="text"
            placeholder="VD: 30A-123.45"
            {...register('licensePlate')}
            className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 uppercase focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
          />
          {errors.licensePlate && (
            <p className="text-sm text-red-600">{errors.licensePlate.message}</p>
          )}
        </div>
      </div>

      {/* Availability */}
      {selectedVehicleTypeId && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="material-symbols-outlined text-gray-400 text-sm">info</span>
            <span className="text-sm font-medium">Trạng thái bãi đỗ:</span>
          </div>
          {headroom === null ? (
            <span className="text-sm text-gray-400">Đang tải...</span>
          ) : headroom <= 0 ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-700 border border-red-200">
              Hết chỗ
            </span>
          ) : headroom <= 5 ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse inline-block" />
              Còn {headroom} suất
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse inline-block" />
              Còn {headroom} suất
            </span>
          )}
        </div>
      )}

      {/* Quota full alert */}
      {isQuotaFull && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-600 shrink-0">lock</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Khung giờ đã khóa đặt chỗ</p>
            <p className="text-sm text-red-600 mt-0.5">
              Bãi đỗ đã đạt giới hạn đặt chỗ cho khung giờ này. Vui lòng chọn khung giờ khác.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || createReservation.isPending}
          className="px-6 py-2 rounded-xl text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Tiếp Tục
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </form>
  )
}
