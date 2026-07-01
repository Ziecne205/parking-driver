import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PRICING } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate parking fee based on duration in minutes
 * Rounds up to nearest hour
 */
export function calculateParkingFee(durationMinutes: number): number {
  const hours = Math.ceil(durationMinutes / 60);
  return hours * PRICING.BASE_RATE;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} phút`;
  }

  if (mins === 0) {
    return `${hours} giờ`;
  }

  return `${hours} giờ ${mins} phút`;
}

/**
 * Format currency in VND
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Format date and time in Vietnamese locale
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format date only
 */
export function formatDate(date: string | Date, format?: string): string {
  const dateObj = new Date(date);

  if (format === 'dd/MM') {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Format time only
 */
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Calculate duration between two dates in minutes
 */
export function calculateDuration(startTime: string | Date, endTime?: string | Date): number {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  return Math.floor((end - start) / (1000 * 60));
}

/**
 * Get status color class for Tailwind
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    Available: 'bg-green-100 text-green-800 border-green-200',
    Occupied: 'bg-red-100 text-red-800 border-red-200',
    Reserved: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Maintenance: 'bg-gray-100 text-gray-800 border-gray-200',
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    Completed: 'bg-green-100 text-green-800 border-green-200',
    Cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    Open: 'bg-red-100 text-red-800 border-red-200',
    Resolved: 'bg-green-100 text-green-800 border-green-200',
    // Capacity-reservation model statuses
    Admitted: 'bg-blue-100 text-blue-800 border-blue-200',
    Parked: 'bg-green-100 text-green-800 border-green-200',
    Moved: 'bg-amber-100 text-amber-800 border-amber-200',
    Abandoned: 'bg-gray-100 text-gray-800 border-gray-200',
    CheckedIn: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Fulfilled: 'bg-green-100 text-green-800 border-green-200',
    Expired: 'bg-gray-100 text-gray-800 border-gray-200',
    InProgress: 'bg-amber-100 text-amber-800 border-amber-200',
    Success: 'bg-green-100 text-green-800 border-green-200',
    Failed: 'bg-red-100 text-red-800 border-red-200',
    Refunded: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Parse slot name to extract floor, zone, and number
 */
export function parseSlotName(slotName: string): { floor: number; zone: string; number: number } | null {
  const match = slotName.match(/^F(\d+)-([A-Z])-(\d+)$/);
  if (!match) return null;

  return {
    floor: parseInt(match[1], 10),
    zone: match[2],
    number: parseInt(match[3], 10),
  };
}

/**
 * Generate slot name from components
 */
export function generateSlotName(floor: number, zone: string, number: number): string {
  return `F${floor}-${zone}-${String(number).padStart(2, '0')}`;
}
