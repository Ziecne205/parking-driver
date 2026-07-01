// Domain label + config constants — capacity-reservation model, single building (v3.1).

export const PRICING = {
  BASE_RATE: 10000, // VND mỗi giờ (giá phẳng)
} as const;

// Đặt chỗ trực tuyến của tài xế chỉ áp dụng cho xe hơi (ô tô, 4 bánh).
// BE trả tên loại xe dạng "Ô tô 4 chỗ" / "Ô tô 7 chỗ" / "Xe máy", nên khớp theo
// tiền tố "ô tô" thay vì so khớp tuyệt đối một tên cố định.
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
