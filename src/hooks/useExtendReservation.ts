import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type AppError } from '@/lib/api'
import type { Reservation } from '@/types/model'
import { mapReservation, type BeReservation } from '@/lib/beMappers'
import { queryKeys } from '@/lib/constants'
import type { PayosLink } from './usePayosLink'

export interface ExtendReservationInput {
  reservationId: string
  /** ISO datetime, must be after the reservation's current expectedExitTime. */
  newExitTime: string
}

export interface ExtendReservationResult {
  reservation: Reservation
  /** Real PayOS link for the added time segment only — priced at the live rate,
   *  separate from the original booking's locked-in price. Same shape as
   *  useCreatePayosLinkMutation's PayosLink. */
  payment: PayosLink
}

interface BeExtendReservationResult {
  reservation: BeReservation
  payment: PayosLink
}

/**
 * Extend a Confirmed/CheckedIn reservation's exit time. BE: POST
 * /driver/reservations/{id}/extend — prices only the added window at the current live
 * rate and returns a PayOS link for it. Unlike the deposit flow, paying this link is not
 * required to keep the extension: an unpaid extension is simply added to amountDue at
 * the gate, so this hook does not chase a payment-confirmation step.
 */
export function useExtendReservation() {
  const queryClient = useQueryClient()
  return useMutation<ExtendReservationResult, AppError, ExtendReservationInput>({
    mutationFn: async ({ reservationId, newExitTime }) => {
      const res = await api.post<BeExtendReservationResult>(
        `/driver/reservations/${reservationId}/extend`,
        { newExitTime },
      )
      return { reservation: mapReservation(res.reservation), payment: res.payment }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myReservations })
      queryClient.invalidateQueries({ queryKey: queryKeys.parkingInfo })
    },
  })
}
