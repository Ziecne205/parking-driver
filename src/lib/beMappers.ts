// Shapes the Spring Boot backend actually returns, plus mappers to the FE `@/types/model`.
// Kept in one place so every hook maps DTOs the same way. Only the fields the driver app
// reads are typed here.
import type { Reservation, User } from '@/types/model'

/** Nested entities the BE serializes in full (JPA open-in-view). */
export interface BeVehicleType {
  vehicleTypeId: number
  typeName: string
  dimensions?: string | null
}

export interface BeUser {
  userId: number
  username: string
  fullName?: string
  email?: string
  phoneNumber?: string
}

/** BE `Reservation` entity (com.parking.entity.Reservation). */
export interface BeReservation {
  reservationId: number
  user?: BeUser | null
  vehicleType?: BeVehicleType | null
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

/** BE Reservation entity -> FE Reservation (flat, string ids). */
export function mapReservation(r: BeReservation): Reservation {
  return {
    reservationId: String(r.reservationId),
    userId: r.user ? String(r.user.userId) : undefined,
    vehicleTypeId: r.vehicleType ? String(r.vehicleType.vehicleTypeId) : '',
    vehicleTypeName: r.vehicleType?.typeName,
    licensePlate: r.licensePlate,
    expectedEntryTime: r.expectedEntryTime,
    expectedExitTime: r.expectedExitTime,
    depositAmount: r.depositAmount,
    status: r.status,
    createdAt: r.createdAt,
  }
}
