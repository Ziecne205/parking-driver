import type { Reservation, ParkingSession } from '@/types/model'

export type { Reservation, ParkingSession }

export interface ReadonlyMyBookingsProps {
  readonly userId: string
  readonly onBack: () => void
}

export interface ReadonlyBookingCardProps {
  readonly reservation: Reservation
  readonly onCancel: (reservationId: string) => void
  readonly isCancelling: boolean
}

export interface ReadonlyFindCarBoxProps {
  readonly className?: string
}
