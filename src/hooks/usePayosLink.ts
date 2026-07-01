import { useQuery } from '@tanstack/react-query'
import { api, type AppError } from '@/lib/api'

/** BE PayosLinkResponse from POST /driver/payments/payos/create-link. */
export interface PayosLink {
  checkoutUrl: string
  qrCode: string // VietQR / EMVCo payload string — render as a QR image
  orderCode: number
  amount: number
}

export interface CreatePayosLinkInput {
  type: 'DEPOSIT' | 'PARKING'
  /** Numeric reservation ID (DEPOSIT) or session ID (PARKING).
   *  Kept as number throughout to avoid silent NaN from Number() conversion (FE-11). */
  id: number
}

/**
 * Create a real PayOS payment link + QR. Needs PayOS keys configured on the BE.
 * Used as a query to prevent double-firing (and "order already exists" errors)
 * during React Strict Mode double-mounts.
 */
export function useCreatePayosLink(input?: CreatePayosLinkInput) {
  return useQuery<PayosLink, AppError>({
    queryKey: ['payos-link', input?.type, input?.id],
    queryFn: () => {
      // FE-11: guard against non-finite IDs before hitting the API
      if (!input || !Number.isFinite(input.id)) {
        throw new Error('Invalid reservation ID — cannot create PayOS link')
      }
      return api.post<PayosLink>('/driver/payments/payos/create-link', {
        type: input.type,
        id: input.id,
      })
    },
    enabled: !!input && Number.isFinite(input?.id),
    staleTime: Infinity, // don't refetch — same orderCode would be rejected by PayOS
  })
}
