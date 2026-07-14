import { useQuery } from '@tanstack/react-query'
import { api, type AppError } from '@/lib/api'

/** BE ReservationQuoteDTO — estimated fee + deposit for a booking window, computed server-side. */
export interface ReservationQuote {
  estimatedFee: number
  depositAmount: number
}

/**
 * Ask the BE to price a booking window (fee + deposit) — GET /driver/reservations/quote.
 * The FE never reimplements the pricing/deposit formula: whatever the Manager configures
 * (pricing policies, deposit percent, day-window) is reflected automatically.
 * `entryISO`/`exitISO` are local datetime strings ("2026-07-14T10:00:00"); the BE binds them
 * to LocalDateTime. Disabled until all three inputs are present and exit is after entry.
 */
export function useReservationQuote(vehicleTypeId?: string, entryISO?: string, exitISO?: string) {
  const enabled =
    !!vehicleTypeId &&
    !!entryISO &&
    !!exitISO &&
    new Date(exitISO).getTime() > new Date(entryISO).getTime()

  return useQuery<ReservationQuote, AppError>({
    queryKey: ['reservation-quote', vehicleTypeId, entryISO, exitISO],
    queryFn: () =>
      api.get<ReservationQuote>(
        `/driver/reservations/quote?vehicleTypeId=${Number(vehicleTypeId)}` +
          `&entryTime=${encodeURIComponent(entryISO!)}&exitTime=${encodeURIComponent(exitISO!)}`,
      ),
    enabled,
    staleTime: 60_000,
  })
}
