import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type AppError } from '@/lib/api'
import type { PaymentMethod } from '@/types/model'

export interface PayDepositInput {
  reservationId: string
  paymentMethod: PaymentMethod
}

export interface PayDepositResult {
  success: boolean
}

/**
 * Confirm the booking deposit.
 *
 * The BE's real gateway is PayOS (POST /driver/payments/payos/create-link), but that needs
 * live PayOS credentials. For the QR/Cash confirm flow we use the BE mock callback
 * (POST /driver/payments/mock-callback) which marks the deposit Paid and flips the
 * reservation Pending -> Confirmed. `paymentMethod` is cosmetic here (the mock endpoint
 * takes none). Swap to the PayOS create-link + redirect flow once keys are configured.
 */
export function usePayDeposit() {
  const queryClient = useQueryClient()
  return useMutation<PayDepositResult, AppError, PayDepositInput>({
    mutationFn: async (input) => {
      const txnRef = `DRV_${Date.now()}`
      const params = new URLSearchParams({
        txnRef,
        reservationId: input.reservationId,
        status: 'Success',
      })
      await api.post<null>(`/driver/payments/mock-callback?${params.toString()}`)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['parking-info'] })
    },
  })
}
