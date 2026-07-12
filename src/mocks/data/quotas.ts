import type { BookingQuota } from '@/types/model'

// Seed quotas covering the car vehicle type across several windows.
// vehicleTypeId matches VEHICLE_TYPES in lots.ts: 'vt-car'
export const mockQuotas: BookingQuota[] = [
  // Ô tô
  {
    quotaId: 'quota-1',
    vehicleTypeId: 'vt-car',
    windowStart: '06:00',
    windowEnd: '08:00',
    quotaPercent: 30,
    isActive: true,
  },
  {
    quotaId: 'quota-2',
    vehicleTypeId: 'vt-car',
    windowStart: '08:00',
    windowEnd: '10:00',
    quotaPercent: 50,
    isActive: true,
  },
  {
    quotaId: 'quota-3',
    vehicleTypeId: 'vt-car',
    windowStart: '10:00',
    windowEnd: '12:00',
    quotaPercent: 40,
    isActive: false,
  },
  {
    quotaId: 'quota-4',
    vehicleTypeId: 'vt-car',
    windowStart: '16:00',
    windowEnd: '18:00',
    quotaPercent: 60,
    isActive: true,
  },
]
