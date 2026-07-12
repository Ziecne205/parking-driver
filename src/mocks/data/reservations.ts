// Capacity-reservation bookings — hold a capacity slot in a window, never a physical slot.
import type { Reservation } from '@/types/model'

// userId '1' is the mock Driver (see auth handler — mock login returns id:'1' for driver role).
// Active statuses (count toward quota): Pending, Confirmed, CheckedIn.
// Seeded so a new "Ô tô" booking in a busy window hits the quota cap (→ 409).
export const mockReservations: Reservation[] = [
  {
    reservationId: 'res-1', vehicleTypeId: 'vt-car', vehicleTypeName: 'Ô tô',
    licensePlate: '51B-10001', expectedEntryTime: '2026-06-15T09:00:00', expectedExitTime: '2026-06-15T11:00:00',
    depositAmount: 4000, status: 'Pending', createdAt: '2026-06-15T07:10:00', userId: '1',
  },
  {
    reservationId: 'res-2', vehicleTypeId: 'vt-car', vehicleTypeName: 'Ô tô',
    licensePlate: '51B-10002', expectedEntryTime: '2026-06-15T09:30:00', expectedExitTime: '2026-06-15T12:30:00',
    depositAmount: 6000, status: 'Confirmed', createdAt: '2026-06-15T07:20:00', userId: '1',
  },
  {
    reservationId: 'res-3', vehicleTypeId: 'vt-car', vehicleTypeName: 'Ô tô',
    licensePlate: '51B-10003', expectedEntryTime: '2026-06-15T10:00:00', expectedExitTime: '2026-06-15T12:00:00',
    depositAmount: 4000, status: 'Confirmed', createdAt: '2026-06-15T07:25:00', userId: '1',
  },
  {
    reservationId: 'res-4', vehicleTypeId: 'vt-car', vehicleTypeName: 'Ô tô',
    licensePlate: '51B-10004', expectedEntryTime: '2026-06-15T08:00:00', expectedExitTime: '2026-06-15T10:00:00',
    depositAmount: 4000, status: 'CheckedIn', createdAt: '2026-06-15T06:40:00', userId: '1',
  },
  {
    reservationId: 'res-5', vehicleTypeId: 'vt-car', vehicleTypeName: 'Ô tô',
    licensePlate: '51B-10005', expectedEntryTime: '2026-06-15T11:00:00', expectedExitTime: '2026-06-15T13:00:00',
    depositAmount: 4000, status: 'Pending', createdAt: '2026-06-15T07:40:00', userId: '1',
  },
  {
    reservationId: 'res-6', vehicleTypeId: 'vt-car', vehicleTypeName: 'Ô tô',
    licensePlate: '51B-10006', expectedEntryTime: '2026-06-15T09:15:00', expectedExitTime: '2026-06-15T11:15:00',
    depositAmount: 4000, status: 'Confirmed', createdAt: '2026-06-15T07:45:00', userId: '1',
  },
  {
    reservationId: 'res-7', vehicleTypeId: 'vt-car', vehicleTypeName: 'Ô tô',
    licensePlate: '51B-10007', expectedEntryTime: '2026-06-14T14:00:00', expectedExitTime: '2026-06-14T16:00:00',
    depositAmount: 4000, status: 'Fulfilled', createdAt: '2026-06-14T12:00:00', userId: '1',
  },
  {
    reservationId: 'res-8', vehicleTypeId: 'vt-car', vehicleTypeName: 'Ô tô',
    licensePlate: '51B-10008', expectedEntryTime: '2026-06-14T15:00:00', expectedExitTime: '2026-06-14T17:00:00',
    depositAmount: 4000, status: 'Cancelled', createdAt: '2026-06-14T10:00:00', userId: '1',
  },
  {
    reservationId: 'res-9', vehicleTypeId: 'vt-car', vehicleTypeName: 'Ô tô',
    licensePlate: '51B-10009', expectedEntryTime: '2026-06-14T08:00:00', expectedExitTime: '2026-06-14T10:00:00',
    depositAmount: 4000, status: 'Expired', createdAt: '2026-06-14T06:00:00', userId: '1',
  },
]
