import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Reservation } from '@/types/model'
import { mapReservation, type BeReservation } from '@/lib/beMappers'
import { queryKeys } from '@/lib/constants'

// BE: GET /driver/reservations/my — server resolves the driver from the JWT, so the
// `userId` arg is only used to gate/scope the query (the endpoint ignores it).
export function useMyReservations(userId: string, options?: { refetchInterval?: number, refetchIntervalInBackground?: boolean }) {
  return useQuery<Reservation[]>({
    queryKey: queryKeys.myReservationsFor(userId),
    queryFn: async () => {
      const list = await api.get<BeReservation[]>('/driver/reservations/my')
      return list.map(mapReservation)
    },
    enabled: !!userId,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: options?.refetchIntervalInBackground,
  })
}
