import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'
import type { ReservationStatus } from '@/types/model'
import { mapReservation, type BeReservation } from '@/lib/beMappers'
import { queryKeys } from '@/lib/constants'

export interface CreateReservationInput {
  vehicleTypeId: string
  licensePlate: string
  expectedEntryTime: string
  expectedExitTime: string
  userId?: string
  override?: boolean
}

export interface CreateReservationResult {
  success: boolean
  /** String at the model boundary — the app uses string reservation IDs everywhere
   *  and converts to a number only at the PayOS API call (usePayosLink). */
  reservationId: string
  status: ReservationStatus
  depositAmount: number
  message: string
}

/**
 * Create a reservation. BE: POST /driver/reservations (user taken from JWT) returning the
 * full Reservation entity. On a locked window the BE throws a 409 BusinessRuleException whose
 * message mentions "quota" — we re-tag it as `code: 'QUOTA_FULL'` so BookForm shows the locked
 * state. Toasts are left to the caller so the quota path can be handled inline.
 */
export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation<CreateReservationResult, AppError, CreateReservationInput>({
    mutationFn: async (input) => {
      try {
        const created = await api.post<BeReservation>('/driver/reservations', {
          vehicleTypeId: Number(input.vehicleTypeId),
          licensePlate: input.licensePlate,
          expectedEntryTime: input.expectedEntryTime,
          expectedExitTime: input.expectedExitTime,
        })
        return {
          success: true,
          reservationId: String(created.reservationId), // string at the model boundary
          status: created.status,
          depositAmount: created.depositAmount,
          message: 'OK',
        }
      } catch (err) {
        const e = err as AppError
        // BE tags the locked-window case as errorCode QUOTA_FULL; fall back to the message.
        if (e?.code !== 'QUOTA_FULL' && /quota/i.test(e?.message ?? '')) {
          throw { ...e, code: 'QUOTA_FULL' }
        }
        throw e
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myReservations })
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reservationId: string) =>
      api.patch<BeReservation>(`/driver/reservations/${reservationId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myReservations })
      toast.success('Đã hủy đặt chỗ')
    },
    onError: (error: AppError) => toast.error(error.message),
  })
}
