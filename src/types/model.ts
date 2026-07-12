// Capacity-Reservation domain model — canonical types going forward.
// New code imports from '@/types/model'. The legacy '@/types' (slot-owns-booking)
// is kept until the /dashboard and /sessions screens migrate off it (then deleted).
// Single building, multiple floors — NO multi-lot (parkingLotId removed v3.1).

// ── Status labels (text as returned by API; service maps INT↔label) ─────────────
export type SlotStatus = 'Available' | 'Occupied' | 'Maintenance'; // NO Reserved
export type SessionStatus = 'Admitted' | 'Parked' | 'Moved' | 'Completed' | 'Abandoned';
export type ReservationStatus =
  | 'Pending' | 'Confirmed' | 'CheckedIn' | 'Fulfilled' | 'Cancelled' | 'Expired';

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  Pending: 'Chờ thanh toán',
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã vào bãi',
  Fulfilled: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  Expired: 'Hết hạn',
}
export type PaymentStatus = 'Pending' | 'Success' | 'Failed' | 'Refunded';
export type PaymentType = 'Deposit' | 'Parking' | 'Penalty';
export type PaymentMethod = 'QR';
export type IncidentStatus = 'Open' | 'InProgress' | 'Resolved';
export type IncidentType =
  | 'UNMAPPED_OCCUPANCY' | 'ABANDONED_SESSION' | 'EXIT_UNCLOSED'
  | 'OVERSTAY' | 'MANUAL_OVERRIDE' | 'OTHER';
export type GateType = 'Entry' | 'Exit';

// ── Core entities ───────────────────────────────────────────────────────────────
export interface VehicleType {
  id: string;
  name: string; // chỉ ô tô, ví dụ "Ô tô"
}

export interface Slot {
  id: string;
  slotCode: string; // F{floor}-{zone}{number}, zone optional → F2-B07 / F2-07
  floor: number;
  zone?: string;
  vehicleTypeId: string;
  status: SlotStatus;
}

export interface Reservation {
  reservationId: string;
  userId?: string; // driver who owns this reservation
  vehicleTypeId: string;
  vehicleTypeName?: string;
  licensePlate: string;
  expectedEntryTime: string; // ISO-8601
  expectedExitTime: string;
  depositAmount: number; // VND
  status: ReservationStatus;
  createdAt: string;
}

export interface ParkingSession {
  sessionId: string;
  reservationId?: string | null; // null for walk-ins
  vehicleTypeId: string;
  vehicleTypeName?: string;
  licensePlate: string;
  assignedSlotCode?: string; // advisory slot at the gate
  actualSlotCode?: string; // slot the camera confirmed
  entryTime: string; // Admitted — billing basis
  parkedTime?: string;
  movedTime?: string;
  exitTime?: string;
  totalFee?: number;
  isPaid: boolean;
  status: SessionStatus;
}

export interface Payment {
  paymentId: string;
  reservationId?: string | null;
  sessionId?: string | null;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
}

export interface Incident {
  incidentId: string;
  issueType: IncidentType;
  slotCode?: string;
  sessionId?: string;
  description: string;
  createdAt: string;
  status: IncidentStatus;
  handledByStaffId?: string;
  resolutionNotes?: string;
  resolveAt?: string;
}

// ── Capacity / availability — the source of truth for "occupancy" ───────────────
export interface ZoneAvailability {
  zone: string;
  available: number;
}

export interface VehicleTypeAvailability {
  vehicleTypeName: string;
  capacity: number; // C — usable slots (minus Maintenance)
  inside: number; // cameras count actual cars
  outstanding: number; // confirmed bookings not yet entered
  walkInHeadroom: number; // C − inside − outstanding (can be negative on capacity crash)
  byZone: ZoneAvailability[];
}

/** Tình trạng chỗ trống toàn tòa (1 building) theo loại xe. */
export interface LotAvailability {
  byVehicleType: VehicleTypeAvailability[];
}

// ── Admin / quota ───────────────────────────────────────────────────────────────
export interface BookingQuota {
  quotaId: string;
  vehicleTypeId: string;
  windowStart: string; // "08:00"
  windowEnd: string; // "10:00"
  quotaPercent: number; // % of C, 0–100
  isActive: boolean;
}

export interface OccupancyWindow {
  windowStart: string;
  windowEnd: string;
  entries: number;
  exits: number;
  inside: number;
}

/** Khoảng ngày cho báo cáo (revenue/traffic). */
export interface DateRange {
  from: string;
  to: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  status?: 'Active' | 'Inactive';
}
