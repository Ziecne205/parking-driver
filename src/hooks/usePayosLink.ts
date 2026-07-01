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
  id: string // reservationId (DEPOSIT) or sessionId (PARKING)
}

/**
 * Create a real PayOS payment link + QR. Needs PayOS keys configured on the BE.
 * Used as a query to prevent double-firing (and "order already exists" errors) 
 * during React Strict Mode double-mounts.
 */
export function useCreatePayosLink(input?: CreatePayosLinkInput) {
  return useQuery<PayosLink, AppError>({
    queryKey: ['payos-link', input?.type, input?.id],
    queryFn: () =>
      api.post<PayosLink>('/driver/payments/payos/create-link', {
        type: input!.type,
        id: Number(input!.id),
      }),
    enabled: !!input,
    staleTime: Infinity, // don't refetch, orderCode would conflict
  })
}
