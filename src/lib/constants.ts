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
