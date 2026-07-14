import { useMutation, useQuery } from '@tanstack/react-query'
import { api, type AppError } from '@/lib/api'
import { queryKeys } from '@/lib/constants'

/** BE PayosLinkResponse from POST /driver/payments/payos/create-link. */
export interface PayosLink {
  checkoutUrl: string
  qrCode: string // VietQR / EMVCo payload string — render as a QR image
  orderCode: number
  amount: number
}

export interface CreatePayosLinkInput {
  type: 'DEPOSIT' | 'PARKING'
  /** String reservation ID (DEPOSIT) or session ID (PARKING) — the model-boundary type.
   *  Converted to a number only at the API call below, where the BE expects numeric. */
  id: string
}

/** Parse a model-boundary string id into the numeric id the BE expects (NaN if invalid). */
const toNumericId = (id?: string) => (id ? Number(id) : NaN)

/**
 * Create a real PayOS payment link + QR. Needs PayOS keys configured on the BE.
 * Used as a query to prevent double-firing (and "order already exists" errors)
 * during React Strict Mode double-mounts.
 */
export function useCreatePayosLink(input?: CreatePayosLinkInput) {
  return useQuery<PayosLink, AppError>({
    queryKey: queryKeys.payosLink(input?.type ?? '', input?.id ?? ''),
    queryFn: () => {
      const numericId = toNumericId(input?.id)
      // Guard against non-finite IDs before hitting the API
      if (!input || !Number.isFinite(numericId)) {
        throw new Error('Invalid reservation ID — cannot create PayOS link')
      }
      return api.post<PayosLink>('/driver/payments/payos/create-link', {
        type: input.type,
        id: numericId,
      })
    },
    enabled: !!input && Number.isFinite(toNumericId(input?.id)),
    staleTime: Infinity, // don't refetch — same orderCode would be rejected by PayOS
  })
}

/**
 * Create a PayOS link on demand — e.g. paying from the bookings list. A mutation (not a query)
 * so it fires only on click; a query would auto-create a link for every Pending card on mount.
 */
export function useCreatePayosLinkMutation() {
  return useMutation<PayosLink, AppError, CreatePayosLinkInput>({
    mutationFn: (input) => {
      const numericId = toNumericId(input.id)
      if (!Number.isFinite(numericId)) {
        throw new Error('Invalid reservation ID — cannot create PayOS link')
      }
      return api.post<PayosLink>('/driver/payments/payos/create-link', {
        type: input.type,
        id: numericId,
      })
    },
  })
}
