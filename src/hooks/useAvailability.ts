import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { LotAvailability, VehicleType } from '@/types/model'
import type { BeParkingInfo } from '@/lib/beMappers'
import { queryKeys } from '@/lib/constants'

// The driver app has a single public source of truth: GET /driver/parking-info.
// It returns both the vehicle-type catalogue and live availability, so useVehicleTypes
// and useAvailability share one cache entry (same queryKey/queryFn) and just `select`
// different views of it.
const PARKING_INFO_KEY = queryKeys.parkingInfo
const fetchParkingInfo = () => api.get<BeParkingInfo>('/driver/parking-info')

/** Vehicle-type catalogue derived from parking-info (driver can't reach /manager/vehicle-types). */
export function useVehicleTypes() {
  return useQuery({
    queryKey: PARKING_INFO_KEY,
    queryFn: fetchParkingInfo,
    select: (info): VehicleType[] =>
      info.availabilityByVehicleType.map((v) => ({
        id: String(v.vehicleTypeId),
        name: v.vehicleTypeName,
      })),
  })
}

/** Realtime headroom view — `walkInHeadroom` = available slots for that vehicle type. */
export function useAvailability() {
  return useQuery({
    queryKey: PARKING_INFO_KEY,
    queryFn: fetchParkingInfo,
    refetchInterval: 30 * 1000, // realtime-ish availability; the only polling query
    select: (info): LotAvailability => ({
      byVehicleType: info.availabilityByVehicleType.map((v) => ({
        vehicleTypeName: v.vehicleTypeName,
        capacity: v.totalSlots,
        inside: v.totalSlots - v.availableSlots,
        outstanding: 0,
        walkInHeadroom: v.availableSlots,
        byZone: [],
      })),
    }),
  })
}
