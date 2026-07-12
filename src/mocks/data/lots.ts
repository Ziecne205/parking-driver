// Capacity-reservation mock data: lots, vehicle types, slots, and derived availability.
// Deterministic statuses (no Math.random) so demos/tests are stable.
import type {
  LotAvailability,
  Slot,
  SlotStatus,
  VehicleType,
  VehicleTypeAvailability,
} from '@/types/model'

export const VEHICLE_TYPES: VehicleType[] = [
  { id: 'vt-car', name: 'Ô tô' },
]

// Mock outstanding (confirmed bookings not yet entered) per vehicle type.
// Real value comes from the reservations slice; hardcoded here for headroom math.
const OUTSTANDING: Record<string, number> = {
  'vt-car': 3,
}

interface FloorSpec {
  floor: number
  vehicleTypeId: string
  zones: string[]
  perZone: number
}

const LAYOUT: FloorSpec[] = [
  { floor: 1, vehicleTypeId: 'vt-car', zones: ['A', 'B'], perZone: 10 },
  { floor: -1, vehicleTypeId: 'vt-car', zones: ['A'], perZone: 10 },
]

function deterministicStatus(seq: number): SlotStatus {
  if (seq % 7 === 0) return 'Maintenance'
  if (seq % 3 === 0) return 'Occupied'
  return 'Available'
}

export function generateSlots(): Slot[] {
  const slots: Slot[] = []
  let seq = 1
  for (const spec of LAYOUT) {
    const floorLabel = spec.floor === -1 ? 'B1' : `F${spec.floor}`
    for (const zone of spec.zones) {
      for (let i = 1; i <= spec.perZone; i++) {
        slots.push({
          id: `slot-${seq}`,
          slotCode: `${floorLabel}-${zone}${i.toString().padStart(2, '0')}`,
          floor: spec.floor,
          zone,
          vehicleTypeId: spec.vehicleTypeId,
          status: deterministicStatus(seq),
        })
        seq++
      }
    }
  }
  return slots
}

/** Compute the per-vehicle-type headroom view from a slot snapshot. */
export function computeAvailability(slots: Slot[]): LotAvailability {
  const byVehicleType: VehicleTypeAvailability[] = VEHICLE_TYPES.map((vt) => {
    const typeSlots = slots.filter((s) => s.vehicleTypeId === vt.id)
    const capacity = typeSlots.filter((s) => s.status !== 'Maintenance').length // C
    const inside = typeSlots.filter((s) => s.status === 'Occupied').length
    const outstanding = OUTSTANDING[vt.id] ?? 0
    const walkInHeadroom = capacity - inside - outstanding

    const zones = Array.from(new Set(typeSlots.map((s) => s.zone).filter(Boolean))) as string[]
    const byZone = zones.sort().map((zone) => ({
      zone,
      available: typeSlots.filter((s) => s.zone === zone && s.status === 'Available').length,
    }))

    return { vehicleTypeName: vt.name, capacity, inside, outstanding, walkInHeadroom, byZone }
  })

  return { byVehicleType }
}
