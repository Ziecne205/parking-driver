// Estimated parking-fee math derived from the BE pricing policy (GET /driver/parking-info →
// pricingPolicies). This is an ESTIMATE for display only; the authoritative fee is computed by
// the backend at checkout. Replaces the old hardcoded PRICING.BASE_RATE flat rate.

/** One pricing policy row from parking-info, keyed by vehicle-type name. */
export interface VehiclePricing {
  vehicleTypeName: string
  basePrice: number // covers the first `baseHours`
  baseHours: number
  extraHourPrice: number // per hour beyond baseHours
  nightSurcharge: number | null
}

export interface FeeEstimate {
  total: number
  billableHours: number // hours actually charged (rounded up, min 1)
  nightSurchargeApplied: number // 0 when it doesn't apply / isn't configured
}

/** Night window used for the surcharge estimate: 22:00–06:00. */
function overlapsNight(startMs: number, endMs: number): boolean {
  // Bookings are short, so step in 30-min slices — cheap and accurate enough for an estimate.
  for (let t = startMs; t < endMs; t += 30 * 60_000) {
    const h = new Date(t).getHours()
    if (h >= 22 || h < 6) return true
  }
  return false
}

/** Find the policy for a vehicle-type name (parking-info keys pricing by name, not id). */
export function findPricingForVehicle(
  pricing: VehiclePricing[],
  vehicleTypeName?: string,
): VehiclePricing | undefined {
  if (!vehicleTypeName) return undefined
  return pricing.find((p) => p.vehicleTypeName === vehicleTypeName)
}

/**
 * Estimate the parking fee for a stay. Returns null for an invalid/empty interval.
 * Fee = basePrice + max(0, ceil(hours) − baseHours) × extraHourPrice, plus one nightSurcharge
 * if the stay overlaps 22:00–06:00. Duration rounds UP to the next whole hour (min 1h).
 */
export function estimateParkingFee(
  policy: VehiclePricing,
  entryISO: string,
  exitISO: string,
): FeeEstimate | null {
  const start = new Date(entryISO).getTime()
  const end = new Date(exitISO).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null

  const billableHours = Math.max(1, Math.ceil((end - start) / 3_600_000))
  const extraHours = Math.max(0, billableHours - policy.baseHours)
  let total = policy.basePrice + extraHours * policy.extraHourPrice

  const surcharge = policy.nightSurcharge ?? 0
  const nightSurchargeApplied = surcharge > 0 && overlapsNight(start, end) ? surcharge : 0
  total += nightSurchargeApplied

  return { total, billableHours, nightSurchargeApplied }
}

/** Deposit policy: 50% of the estimated parking fee. */
export function estimateDeposit(feeTotal: number): number {
  return Math.round(feeTotal / 2)
}
