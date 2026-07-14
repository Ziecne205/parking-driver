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
  /** Reservation UUID (DEPOSIT) or numeric session ID as a string (PARKING) — the
   *  model-boundary type. DEPOSIT is sent as-is; PARKING is converted to a number
   *  at the API call below, where the BE still expects a numeric sessionId. */
  id: string
}

/** Is `input.id` well-formed for its type — a non-empty UUID string for DEPOSIT, a finite number for PARKING. */
const isValidId = (input?: CreatePayosLinkInput) => {
  if (!input?.id) return false
  return input.type === 'PARKING' ? Number.isFinite(Number(input.id)) : true
}

/** Body id for the create-link call: DEPOSIT keeps the UUID string, PARKING needs the numeric sessionId. */
const toRequestId = (input: CreatePayosLinkInput) =>
  input.type === 'PARKING' ? Number(input.id) : input.id

/**
 * Create a real PayOS payment link + QR. Needs PayOS keys configured on the BE.
 * Used as a query to prevent double-firing (and "order already exists" errors)
 * during React Strict Mode double-mounts.
 */
export function useCreatePayosLink(input?: CreatePayosLinkInput) {
  return useQuery<PayosLink, AppError>({
    queryKey: queryKeys.payosLink(input?.type ?? '', input?.id ?? ''),
    queryFn: () => {
      // Guard against missing/invalid IDs before hitting the API
      if (!input || !isValidId(input)) {
        throw new Error('Invalid reservation ID — cannot create PayOS link')
      }
      return api.post<PayosLink>('/driver/payments/payos/create-link', {
        type: input.type,
        id: toRequestId(input),
      })
    },
    enabled: isValidId(input),
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
      if (!isValidId(input)) {
        throw new Error('Invalid reservation ID — cannot create PayOS link')
      }
      return api.post<PayosLink>('/driver/payments/payos/create-link', {
        type: input.type,
        id: toRequestId(input),
      })
    },
  })
}
