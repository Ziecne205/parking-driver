import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type AppError } from '@/lib/api'
import { queryKeys } from '@/lib/constants'

export interface PayDepositInput {
  reservationId: string
  /** The exact PayOS orderCode from the return URL — the transaction that was actually paid.
   *  Without it the BE would fall back to the latest attempt, which may be an unpaid retry. */
  orderCode?: string
}

export interface PayDepositResult {
  success: boolean
}

/**
 * Confirm the booking deposit → BE sets depositStatus=Paid, reservation Pending -> Confirmed.
 * Used by (demo) QR.
 */
export function usePayDeposit() {
  const queryClient = useQueryClient()
  return useMutation<PayDepositResult, AppError, PayDepositInput>({
    mutationFn: async (input) => {
      const qs = input.orderCode ? `?orderCode=${encodeURIComponent(input.orderCode)}` : ''
      await api.post<unknown>(`/driver/reservations/${input.reservationId}/confirm-deposit${qs}`)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myReservations })
      queryClient.invalidateQueries({ queryKey: queryKeys.parkingInfo })
    },
  })
}
