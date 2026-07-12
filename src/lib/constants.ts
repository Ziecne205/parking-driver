// Domain label + config constants — capacity-reservation model, single building (v3.1).

export const PRICING = {
  BASE_RATE: 10000, // VND mỗi giờ (giá phẳng)
} as const;

// sessionStorage key that bridges DepositCheckout -> /driver/payment/return across the
// full-page PayOS redirect. Shared so the writer and reader can't drift apart.
export const PENDING_DEPOSIT_KEY = 'pending_deposit_reservation';

// Single source of truth for React Query keys. Hooks build keys from here so an
// invalidation can never silently miss a query because a literal was mistyped.
export const queryKeys = {
  parkingInfo: ['parking-info'] as const,
  /** Prefix — matches every per-user my-reservations query on invalidate. */
  myReservations: ['my-reservations'] as const,
  myReservationsFor: (userId: string) => ['my-reservations', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  payosLink: (type: string, id: string) => ['payos-link', type, id] as const,
  sessionHistory: ['driver-session-history'] as const,
} as const;

// Hệ thống chỉ quản lý bãi đỗ ô tô. Giữ lại filter theo tiền tố "ô tô" như một lớp
// phòng thủ (khớp "Ô tô", "Ô tô 4 chỗ"...) phòng khi dữ liệu còn sót loại xe khác.
export function isCarVehicleType(name: string): boolean {
  return name.trim().toLowerCase().includes('ô tô');
}

export const REFRESH_INTERVAL = 10000; // 10s — real-time refetch interval


export const SLOT_STATUS_LABELS: Record<string, string> = {
  Available: 'Trống',
  Occupied: 'Đã có xe',
  Maintenance: 'Bảo trì',
};

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  Pending: 'Chờ cọc',
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã vào',
  Fulfilled: 'Đã đỗ',
  Cancelled: 'Đã hủy',
  Expired: 'Hết hạn',
};

export const SESSION_STATUS_LABELS: Record<string, string> = {
  Admitted: 'Đã vào (chờ đỗ)',
  Parked: 'Đã đỗ',
  Moved: 'Đang rời ô',
  Completed: 'Hoàn thành',
  Abandoned: 'Bỏ dở',
};

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  UNMAPPED_OCCUPANCY: 'Xe lậu (không khớp phiên)',
  ABANDONED_SESSION: 'Phiên bỏ dở',
  EXIT_UNCLOSED: 'Cổng ra chưa đóng',
  OVERSTAY: 'Quá giờ',
  MANUAL_OVERRIDE: 'Cho vào thủ công (audit)',
  OTHER: 'Khác',
};

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  Open: 'Chưa xử lý',
  InProgress: 'Đang xử lý',
  Resolved: 'Đã xử lý',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  QR: 'Mã QR',
};
