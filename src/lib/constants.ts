// Domain label + config constants — capacity-reservation model, single building (v3.1).

export const PRICING = {
  BASE_RATE: 10000, // VND mỗi giờ (giá phẳng)
} as const;

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
  Cash: 'Tiền mặt',
  QR: 'Mã QR',
};
