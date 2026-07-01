import type { BookingQuota } from '@/types/model'

// Seed quotas covering both vehicle types across several windows.
// vehicleTypeId matches VEHICLE_TYPES in lots.ts: 'vt-car' | 'vt-moto'
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
  // Xe máy
  {
    quotaId: 'quota-5',
    vehicleTypeId: 'vt-moto',
    windowStart: '06:00',
    windowEnd: '08:00',
    quotaPercent: 25,
    isActive: true,
  },
  {
    quotaId: 'quota-6',
    vehicleTypeId: 'vt-moto',
    windowStart: '08:00',
    windowEnd: '10:00',
    quotaPercent: 60,
    isActive: true,
  },
  {
    quotaId: 'quota-7',
    vehicleTypeId: 'vt-moto',
    windowStart: '10:00',
    windowEnd: '12:00',
    quotaPercent: 20,
    isActive: false,
  },
  {
    quotaId: 'quota-8',
    vehicleTypeId: 'vt-moto',
    windowStart: '16:00',
    windowEnd: '18:00',
    quotaPercent: 70,
    isActive: true,
  },
]
