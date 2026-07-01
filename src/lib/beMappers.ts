// Shapes the Spring Boot backend actually returns, plus mappers to the FE `@/types/model`.
// Kept in one place so every hook maps DTOs the same way. Only the fields the driver app
// reads are typed here.
import type { Reservation, User } from '@/types/model'

/** BE `ReservationDTO` (flat — no nested User/VehicleType entity). */
export interface BeReservation {
  reservationId: number
  userId?: number | null
  vehicleTypeId?: number | null
  vehicleTypeName?: string | null
  licensePlate: string
  expectedEntryTime: string
  expectedExitTime: string
  depositAmount: number
  depositStatus?: string
  status: Reservation['status']
  createdAt: string
}

/** BE `/driver/parking-info` payload (ParkingInfoResponse). */
export interface BeParkingInfo {
  parkingName: string
  operatingHours: string
  totalAvailableSlots: number
  availabilityByVehicleType: Array<{
    vehicleTypeId: number
    vehicleTypeName: string
    totalSlots: number
    availableSlots: number
  }>
  pricingPolicies: Array<{
    vehicleTypeName: string
    basePrice: number
    baseHours: number
    extraHourPrice: number
    nightSurcharge: number | null
  }>
}

/** BE `/driver/profile` payload (ProfileDTO). */
export interface BeProfile {
  username: string
  fullName?: string | null
  email?: string | null
  phoneNumber?: string | null
  roleName?: string | null
  status?: string | null
}


/** BE ProfileDTO -> FE User. */
export function mapProfile(p: BeProfile): User {
  return {
    id: p.username,
    fullName: p.fullName ?? p.username,
    email: p.email ?? '',
    phone: p.phoneNumber ?? undefined,
    status: p.status === 'Inactive' ? 'Inactive' : 'Active',
  }
}

export function mapReservationStatus(status?: string | null): Reservation['status'] {
  if (!status) return 'Pending'
  const up = status.toUpperCase()
  if (up === 'CONFIRMED') return 'Confirmed'
  if (up === 'CHECKED_IN' || up === 'CHECKEDIN') return 'CheckedIn'
  if (up === 'FULFILLED') return 'Fulfilled'
  if (up === 'CANCELLED') return 'Cancelled'
  if (up === 'EXPIRED') return 'Expired'
  return 'Pending'
}

/** BE ReservationDTO -> FE Reservation (string ids). */
export function mapReservation(r: BeReservation): Reservation {
  return {
    reservationId: String(r.reservationId),
    userId: r.userId != null ? String(r.userId) : undefined,
    vehicleTypeId: r.vehicleTypeId != null ? String(r.vehicleTypeId) : '',
    vehicleTypeName: r.vehicleTypeName ?? undefined,
    licensePlate: r.licensePlate,
    expectedEntryTime: r.expectedEntryTime,
    expectedExitTime: r.expectedExitTime,
    depositAmount: r.depositAmount,
    status: mapReservationStatus(r.status),
    createdAt: r.createdAt,
  }
}
