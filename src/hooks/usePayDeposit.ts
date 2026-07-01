import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type AppError } from '@/lib/api'
import type { PaymentMethod } from '@/types/model'

export interface PayDepositInput {
  reservationId: string
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
      await api.post<unknown>(`/driver/reservations/${input.reservationId}/confirm-deposit`)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['parking-info'] })
    },
  })
}
