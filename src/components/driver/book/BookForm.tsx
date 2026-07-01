'use client'

import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useVehicleTypes, useAvailability } from '@/hooks/useAvailability'
import { useCreateReservation, type CreateReservationResult } from '@/hooks/useReservations'
import { isCarVehicleType } from '@/lib/constants'
import type { BookFormValues } from './types'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate slots 00 | 15 | 30 | 45 for every hour. */
function quarterHourOptions() {
  const opts: { label: string; value: string }[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      opts.push({ label: `${hh}:${mm}`, value: `${hh}:${mm}` })
    }
  }
  return opts
}
const QUARTER_HOURS = quarterHourOptions()

/** Today's date in YYYY-MM-DD (local time). */
function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Snap now+offset minutes to the next 15-min boundary → "HH:mm". */
function snapTo15(offsetMs: number): string {
  const d = new Date(Date.now() + offsetMs)
  const totalMin = d.getHours() * 60 + d.getMinutes()
  const snapped = Math.ceil(totalMin / 15) * 15
  const hh = String(Math.floor(snapped / 60) % 24).padStart(2, '0')
  const mm = String(snapped % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * Combine YYYY-MM-DD + HH:mm → local datetime string (no timezone), e.g. "2026-07-01T16:00:00".
 * The BE binds this to a `LocalDateTime`, so we must NOT send a UTC "Z" string (it both shifts
 * the wall-clock time by the offset and can fail ISO_LOCAL_DATE_TIME parsing).
 */
function toLocalDateTime(date: string, time: string): string {
  return `${date}T${time}:00`
}

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    vehicleTypeId: z.string().min(1),
    licensePlate: z.string().min(1, 'Vui lòng nhập biển số xe'),
    entryDate: z.string().min(1, 'Vui lòng chọn ngày vào'),
    entryTime: z.string().min(1, 'Vui lòng chọn giờ vào'),
    exitDate: z.string().min(1, 'Vui lòng chọn ngày ra'),
    exitTime: z.string().min(1, 'Vui lòng chọn giờ ra'),
  })
  .refine(
    (d) => new Date(`${d.exitDate}T${d.exitTime}:00`) > new Date(`${d.entryDate}T${d.entryTime}:00`),
    { message: 'Giờ ra phải sau giờ vào', path: ['exitTime'] },
  )

type FormValues = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReadonlyBookFormProps {
  readonly userId?: string
  readonly onSuccess: (result: CreateReservationResult, values: BookFormValues) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BookForm({ userId, onSuccess }: ReadonlyBookFormProps) {
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const createReservation = useCreateReservation()

  // Đặt chỗ trực tuyến chỉ dành cho xe ô tô (4 bánh). Có thể có nhiều loại (4 chỗ / 7 chỗ).
  const carTypes = useMemo(() => vehicleTypes.filter((vt) => isCarVehicleType(vt.name)), [vehicleTypes])

  const today = useMemo(todayLocal, [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleTypeId: '',
      licensePlate: '',
      entryDate: today,
      entryTime: snapTo15(15 * 60_000),      // now + 15 min
      exitDate: today,
      exitTime: snapTo15(2 * 3600_000),       // now + 2 h
    },
  })

  const selectedVehicleTypeId = watch('vehicleTypeId')

  // Auto-select a car type once the catalogue loads; keep the current value if it's already a car.
  useEffect(() => {
    if (carTypes.length > 0 && !carTypes.some((c) => c.id === selectedVehicleTypeId)) {
      setValue('vehicleTypeId', carTypes[0].id, { shouldValidate: true })
    }
  }, [carTypes, selectedVehicleTypeId, setValue])

  const { data: availability } = useAvailability()

  const vehicleAvailability = availability?.byVehicleType.find((vt) => {
    const matched = vehicleTypes.find((v) => v.id === selectedVehicleTypeId)
    return vt.vehicleTypeName === matched?.name
  })
  const headroom = vehicleAvailability?.walkInHeadroom ?? null

  const onSubmit = async (values: FormValues) => {
    try {
      const entryISO = toLocalDateTime(values.entryDate, values.entryTime)
      const exitISO  = toLocalDateTime(values.exitDate, values.exitTime)
      const result = await createReservation.mutateAsync({
        vehicleTypeId: values.vehicleTypeId,
        licensePlate: values.licensePlate.toUpperCase(),
        expectedEntryTime: entryISO,
        expectedExitTime: exitISO,
        userId,
      })
      onSuccess(result, {
        vehicleTypeId: values.vehicleTypeId,
        licensePlate: values.licensePlate.toUpperCase(),
        expectedEntryTime: entryISO,
        expectedExitTime: exitISO,
      })
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      if (e?.code === 'QUOTA_FULL') return // handled below
      toast.error(e?.message ?? 'Đặt chỗ thất bại')
    }
  }

  const isQuotaFull =
    createReservation.isError && (createReservation.error as { code?: string })?.code === 'QUOTA_FULL'

  const selectCls =
    'w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none cursor-pointer'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Booking details */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Chi Tiết Đặt Chỗ</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Đặt chỗ trực tuyến áp dụng cho <strong>xe ô tô</strong>. Chọn khung giờ theo bội số 15 phút.
          </p>
        </div>

        {/* Car type — only shown when there is more than one car option (4 chỗ / 7 chỗ) */}
        {carTypes.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="vehicleTypeId">
              Loại Xe Ô Tô
            </label>
            <Controller
              control={control}
              name="vehicleTypeId"
              render={({ field }) => (
                <select {...field} id="vehicleTypeId" className={selectCls}>
                  {carTypes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            />
          </div>
        )}

        {/* Entry */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Giờ Vào Dự Kiến</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <input type="date" min={today} {...register('entryDate')} className={selectCls} />
              {errors.entryDate && <p className="text-xs text-red-600">{errors.entryDate.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Controller
                control={control}
                name="entryTime"
                render={({ field }) => (
                  <select {...field} className={selectCls}>
                    {QUARTER_HOURS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
              />
              {errors.entryTime && <p className="text-xs text-red-600">{errors.entryTime.message}</p>}
            </div>
          </div>
        </div>

        {/* Exit */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Giờ Ra Dự Kiến</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <input type="date" min={today} {...register('exitDate')} className={selectCls} />
              {errors.exitDate && <p className="text-xs text-red-600">{errors.exitDate.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Controller
                control={control}
                name="exitTime"
                render={({ field }) => (
                  <select {...field} className={selectCls}>
                    {QUARTER_HOURS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
              />
              {errors.exitTime && <p className="text-xs text-red-600">{errors.exitTime.message}</p>}
            </div>
          </div>
        </div>

        {/* License plate */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="licensePlate">
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
            <p className="text-xs text-red-600">{errors.licensePlate.message}</p>
          )}
        </div>
      </div>

      {/* Availability badge */}
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

      {/* Submit */}
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