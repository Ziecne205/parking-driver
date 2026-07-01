import { http, HttpResponse } from 'msw'
import {
  VEHICLE_TYPES,
  generateSlots,
  computeAvailability,
} from './data/lots'
import { mockIncidents } from './data/incidents'
import { mockReservations } from './data/reservations'
import { mockQuotas } from './data/quotas'
import { MOCK_USERS, findAccountByEmail, accountForUnknownEmail } from './data/users'
import type {
  BookingQuota,
  Incident,
  ParkingSession,
  Reservation,
  ReservationStatus,
} from '@/types/model'
import type { CreateSessionRequest } from './types'

// ── User profile + saved vehicles (in-memory store) ──────────────────────────
interface SavedVehicle { id: string; licensePlate: string; vehicleTypeId: string; brand?: string; model?: string; color?: string }
interface UserProfile { id: string; email: string; phone: string; fullName: string }

// Profile store seeded from the single mock-accounts source (all 4 roles share ids with auth).
const usersStore: Record<string, UserProfile> = Object.fromEntries(
  MOCK_USERS.map((u) => [
    u.id,
    { id: u.id, email: u.email, phone: u.phone, fullName: u.fullName },
  ]),
)
const vehiclesStore: Record<string, SavedVehicle[]> = {
  'u-driver': [
    { id: 'sv-1', licensePlate: '29A-123.45', vehicleTypeId: 'vt-car' },
    { id: 'sv-2', licensePlate: '30G-789.12', vehicleTypeId: 'vt-moto' },
  ],
}

// ── Capacity-reservation model state (new contract) ─────────────────────────────
let slotsV2 = generateSlots()
let incidentsV2 = structuredClone(mockIncidents)
let reservationsV2 = structuredClone(mockReservations)
let quotasV2: BookingQuota[] = structuredClone(mockQuotas)

// sessionsV2 — phiên gửi xe (app tài xế không cần seed sẵn của nhân viên)
let sessionsV2: ParkingSession[] = []

const ACTIVE_RES_STATUSES: ReservationStatus[] = ['Pending', 'Confirmed', 'CheckedIn']

/** Find the active quota % for a vehicle type + time window. Falls back to 20% if none defined. */
function resolveQuotaPercent(
  vehicleTypeId: string,
  entryTime: string,
): number {
  // Parse entry time as HH:mm for window matching
  const entryDate = new Date(entryTime)
  const hhmm = `${entryDate.getHours().toString().padStart(2, '0')}:${entryDate.getMinutes().toString().padStart(2, '0')}`
  const match = quotasV2.find(
    (q) =>
      q.vehicleTypeId === vehicleTypeId &&
      q.isActive &&
      hhmm >= q.windowStart &&
      hhmm < q.windowEnd,
  )
  return match ? match.quotaPercent / 100 : 0.2
}

interface MaintenanceRequest {
  slotCodes: string[]
  maintenance: boolean
}

interface ResolveIncidentRequest {
  handledByStaffId?: string
  resolutionNotes?: string
}

interface CreateReservationRequest {
  vehicleTypeId: string
  licensePlate: string
  expectedEntryTime: string
  expectedExitTime: string
  userId?: string
  override?: boolean // Manager bypass of a locked window
}

export const handlers = [
  // ── User profile ─────────────────────────────────────────────────────────────
  http.get('/api/users/:id', ({ params }) => {
    const user = usersStore[String(params.id)]
    if (!user) return HttpResponse.json({ success: false, errorCode: 'NOT_FOUND' }, { status: 404 })
    const vehicles = vehiclesStore[String(params.id)] ?? []
    return HttpResponse.json({ user, vehicles })
  }),

  http.put('/api/users/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as Partial<UserProfile>
    if (!usersStore[id]) return HttpResponse.json({ success: false, errorCode: 'NOT_FOUND' }, { status: 404 })
    usersStore[id] = { ...usersStore[id], ...body, id }
    return HttpResponse.json(usersStore[id])
  }),

  http.get('/api/users/:id/vehicles', ({ params }) => {
    const vehicles = vehiclesStore[String(params.id)] ?? []
    return HttpResponse.json(vehicles)
  }),

  http.post('/api/users/:id/vehicles', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as Omit<SavedVehicle, 'id'>
    if (!vehiclesStore[id]) vehiclesStore[id] = []
    const vehicle: SavedVehicle = { ...body, id: `sv-${Date.now()}` }
    vehiclesStore[id].push(vehicle)
    return HttpResponse.json(vehicle, { status: 201 })
  }),

  http.delete('/api/users/:id/vehicles/:vehicleId', ({ params }) => {
    const id = String(params.id)
    const vehicleId = String(params.vehicleId)
    if (vehiclesStore[id]) {
      vehiclesStore[id] = vehiclesStore[id].filter((v) => v.id !== vehicleId)
    }
    return HttpResponse.json({ success: true })
  }),


  // ── Sessions V2 (capacity-reservation model) ──────────────────────────────────
  http.get('/api/sessions', () => {
    const OPEN_STATUSES = ['Admitted', 'Parked', 'Moved']
    return HttpResponse.json(sessionsV2.filter((s) => OPEN_STATUSES.includes(s.status)))
  }),

  http.get('/api/sessions/find', ({ request }) => {
    const url = new URL(request.url)
    const plate = url.searchParams.get('plate') ?? ''
    const OPEN_STATUSES = ['Admitted', 'Parked', 'Moved']
    const match = sessionsV2.find(
      (s) =>
        OPEN_STATUSES.includes(s.status) &&
        s.licensePlate.toLowerCase().includes(plate.toLowerCase()),
    )
    if (!match) {
      return HttpResponse.json(
        { success: false, message: 'Không tìm thấy xe', errorCode: 'NOT_FOUND' },
        { status: 404 },
      )
    }
    return HttpResponse.json(match)
  }),

  // ── Capacity-reservation endpoints (APIs-List.md) ─────────────────────────────
  http.get('/api/vehicle-types', () => HttpResponse.json(VEHICLE_TYPES)),

  // Per-slot list for the visual map (toàn tòa).
  http.get('/api/slots-map', () => HttpResponse.json(slotsV2)),

  // Realtime availability / headroom — source of truth for "occupancy" (toàn tòa).
  http.get('/api/availability', () => HttpResponse.json(computeAvailability(slotsV2))),

  // Manager maintenance toggle + capacity-crash warning.
  http.post('/api/admin/slots/maintenance', async ({ request }) => {
    const { slotCodes, maintenance } = (await request.json()) as MaintenanceRequest
    slotsV2 = slotsV2.map((s) =>
      slotCodes.includes(s.slotCode)
        ? { ...s, status: maintenance ? 'Maintenance' : 'Available' }
        : s
    )
    const availability = computeAvailability(slotsV2)
    const crashed = availability.byVehicleType.filter((t) => t.walkInHeadroom < 0)
    return HttpResponse.json({
      success: true,
      availability,
      warning: crashed.length
        ? {
            errorCode: 'CAPACITY_CRASH',
            message: 'Thao tác làm sức chứa tụt dưới số xe đang giữ — vãng lai bị chặn 100%.',
            affectedTypes: crashed.map((t) => t.vehicleTypeName),
          }
        : null,
    })
  }),

  // Incidents — list (status filter) + resolve.
  http.get('/api/incidents', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    let result = incidentsV2
    if (status && status !== 'all') result = result.filter((i) => i.status === status)
    return HttpResponse.json(result)
  }),

  http.put('/api/incidents/:id/resolve', async ({ params, request }) => {
    const body = (await request.json()) as ResolveIncidentRequest
    const idx = incidentsV2.findIndex((i) => i.incidentId === params.id)
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, message: 'Không tìm thấy sự cố', errorCode: 'NOT_FOUND' },
        { status: 404 },
      )
    }
    incidentsV2[idx] = {
      ...incidentsV2[idx],
      status: 'Resolved',
      handledByStaffId: body.handledByStaffId ?? incidentsV2[idx].handledByStaffId,
      resolutionNotes: body.resolutionNotes,
      resolveAt: new Date().toISOString(),
    }
    return HttpResponse.json(incidentsV2[idx])
  }),

  // Reservations by user — driver "my bookings"
  http.get('/api/reservations/user/:userId', ({ params, request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    let result = reservationsV2.filter((r) => r.userId === params.userId)
    if (status && status !== 'all') result = result.filter((r) => r.status === status)
    return HttpResponse.json(result)
  }),

  // Reservations — capacity-slot bookings (no physical slot).
  http.get('/api/reservations', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    let result = reservationsV2
    if (status && status !== 'all') result = result.filter((r) => r.status === status)
    return HttpResponse.json(result)
  }),

  http.post('/api/reservations', async ({ request }) => {
    const body = (await request.json()) as CreateReservationRequest

    // Quota check: quotaAbs = ceil(resolvedPercent * C(type)); a Manager may override.
    const capacity = slotsV2.filter(
      (s) => s.vehicleTypeId === body.vehicleTypeId && s.status !== 'Maintenance',
    ).length
    const quotaPercent = resolveQuotaPercent(body.vehicleTypeId, body.expectedEntryTime)
    const quotaAbs = Math.ceil(quotaPercent * capacity)
    const activeCount = reservationsV2.filter(
      (r) => r.vehicleTypeId === body.vehicleTypeId && ACTIVE_RES_STATUSES.includes(r.status),
    ).length
    if (activeCount >= quotaAbs && !body.override) {
      return HttpResponse.json(
        { success: false, message: 'Khung giờ đã khóa đặt chỗ', errorCode: 'QUOTA_FULL' },
        { status: 409 },
      )
    }

    // Deposit = 20% of estimated parking fee (10k VND/hour, rounded up).
    const hours = Math.max(
      1,
      Math.ceil(
        (new Date(body.expectedExitTime).getTime() - new Date(body.expectedEntryTime).getTime()) /
          3_600_000,
      ),
    )
    const depositAmount = Math.round(hours * 10_000 * 0.2)
    const vehicleTypeName = VEHICLE_TYPES.find((v) => v.id === body.vehicleTypeId)?.name

    const reservation: Reservation = {
      reservationId: `res-${Date.now()}`,
      vehicleTypeId: body.vehicleTypeId,
      vehicleTypeName,
      licensePlate: body.licensePlate,
      expectedEntryTime: body.expectedEntryTime,
      expectedExitTime: body.expectedExitTime,
      depositAmount,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }
    reservationsV2.push(reservation)
    return HttpResponse.json(
      {
        success: true,
        reservationId: reservation.reservationId,
        status: 'Pending',
        depositAmount,
        message: 'Vui lòng thanh toán cọc để xác nhận',
      },
      { status: 201 },
    )
  }),

  http.post('/api/reservations/:id/cancel', ({ params }) => {
    const idx = reservationsV2.findIndex((r) => r.reservationId === params.id)
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, message: 'Không tìm thấy đặt chỗ', errorCode: 'NOT_FOUND' },
        { status: 404 },
      )
    }
    reservationsV2[idx] = { ...reservationsV2[idx], status: 'Cancelled' }
    return HttpResponse.json({ success: true, status: 'Cancelled' })
  }),

  // Quotas — GET list, POST create, PUT update.
  http.get('/api/admin/quotas', () => HttpResponse.json(quotasV2)),

  http.post('/api/admin/quotas', async ({ request }) => {
    const body = (await request.json()) as Omit<BookingQuota, 'quotaId'>
    if (body.quotaPercent < 0 || body.quotaPercent > 100) {
      return HttpResponse.json(
        { success: false, message: 'quotaPercent phải trong khoảng 0–100', errorCode: 'INVALID_INPUT' },
        { status: 422 },
      )
    }
    const quota: BookingQuota = { ...body, quotaId: `quota-${Date.now()}` }
    quotasV2.push(quota)
    return HttpResponse.json(quota, { status: 201 })
  }),

  http.put('/api/admin/quotas/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<BookingQuota>
    if (body.quotaPercent !== undefined && (body.quotaPercent < 0 || body.quotaPercent > 100)) {
      return HttpResponse.json(
        { success: false, message: 'quotaPercent phải trong khoảng 0–100', errorCode: 'INVALID_INPUT' },
        { status: 422 },
      )
    }
    const idx = quotasV2.findIndex((q) => q.quotaId === params.id)
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, message: 'Không tìm thấy hạn mức', errorCode: 'NOT_FOUND' },
        { status: 404 },
      )
    }
    quotasV2[idx] = { ...quotasV2[idx], ...body, quotaId: quotasV2[idx].quotaId }
    return HttpResponse.json(quotasV2[idx])
  }),

  // Reports — revenue + occupancy series for a date range.
  // Pricing: 10k/session 06–18h, 15k/session 18–06h; sessions vary by day-of-week.
  http.get('/api/admin/reports', ({ request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from') ?? '2026-06-11'
    const to   = url.searchParams.get('to')   ?? '2026-06-17'

    const occupancyWindows = [
      { windowStart: '06:00', windowEnd: '08:00', entries: 12,  exits: 2,   inside: 10  },
      { windowStart: '08:00', windowEnd: '10:00', entries: 58,  exits: 8,   inside: 60  },
      { windowStart: '10:00', windowEnd: '12:00', entries: 34,  exits: 22,  inside: 72  },
      { windowStart: '12:00', windowEnd: '14:00', entries: 20,  exits: 38,  inside: 54  },
      { windowStart: '14:00', windowEnd: '16:00', entries: 42,  exits: 15,  inside: 81  },
      { windowStart: '16:00', windowEnd: '18:00', entries: 65,  exits: 20,  inside: 126 },
      { windowStart: '18:00', windowEnd: '20:00', entries: 30,  exits: 55,  inside: 101 },
      { windowStart: '20:00', windowEnd: '22:00', entries: 10,  exits: 60,  inside: 51  },
      { windowStart: '22:00', windowEnd: '00:00', entries: 5,   exits: 40,  inside: 16  },
    ]

    // Generate one RevenuePoint per day in [from, to].
    const revenue = []
    const cursor = new Date(from)
    const end = new Date(to)
    const BASE_SESSIONS = [41, 58, 74, 89, 102, 95, 71] // Mon–Sun profile
    while (cursor <= end) {
      const dow = cursor.getDay() // 0=Sun
      const sessions = BASE_SESSIONS[dow] + Math.round((Math.random() - 0.5) * 8)
      // day sessions (06–18h) ~60%, night (18–06h) ~40%
      const dayS  = Math.round(sessions * 0.6)
      const nightS = sessions - dayS
      const rev = dayS * 10_000 + nightS * 15_000
      const occupancyRate = Math.min(99, Math.round(40 + sessions * 0.55))
      revenue.push({
        date: cursor.toISOString().slice(0, 10),
        revenue: rev,
        sessions,
        occupancyRate,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    return HttpResponse.json({ revenue, occupancy: occupancyWindows })
  }),

  // Staff manual entry — tạo phiên thủ công trên model state (slotsV2/sessionsV2).
  http.post('/api/sessions', async ({ request }) => {
    const data = await request.json() as CreateSessionRequest
    const slot = slotsV2.find((s) => s.id === data.slot_id)

    const sessionId = `sess-manual-${Date.now()}`
    const newSession: ParkingSession = {
      sessionId,
      reservationId: null,
      vehicleTypeId: slot?.vehicleTypeId ?? 'vt-car',
      licensePlate: data.license_plate,
      assignedSlotCode: slot?.slotCode,
      actualSlotCode: slot?.slotCode,
      entryTime: new Date().toISOString(),
      isPaid: false,
      status: 'Parked',
    }
    sessionsV2.push(newSession)

    if (slot) {
      slotsV2 = slotsV2.map((s) => (s.id === slot.id ? { ...s, status: 'Occupied' as const } : s))
    }

    return HttpResponse.json(newSession, { status: 201 })
  }),

  // Payments — POST /api/payments (paymentType:'Parking' | 'Deposit')
  http.post('/api/payments', async ({ request }) => {
    const body = await request.json() as {
      paymentType: string
      sessionId?: string
      reservationId?: string
      paymentMethod: string
      amount?: number
    }

    // Deposit payment: confirm a reservation
    if (body.paymentType === 'Deposit') {
      const resIdx = reservationsV2.findIndex((r) => r.reservationId === body.reservationId)
      if (resIdx === -1) {
        return HttpResponse.json(
          { success: false, message: 'Không tìm thấy đặt chỗ', errorCode: 'NOT_FOUND' },
          { status: 404 },
        )
      }
      reservationsV2[resIdx] = { ...reservationsV2[resIdx], status: 'Confirmed' }
      return HttpResponse.json({
        success: true,
        paymentId: `DEP-${Date.now()}`,
        status: 'Success',
      })
    }

    const idx = sessionsV2.findIndex((s) => s.sessionId === body.sessionId)
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, message: 'Không tìm thấy phiên', errorCode: 'NOT_FOUND' },
        { status: 404 },
      )
    }

    const session = sessionsV2[idx]
    const DAY_RATE = 10_000
    const NIGHT_RATE = 15_000
    const SURCHARGE = 5_000

    let fee = session.totalFee
    if (fee == null) {
      const totalMinutes = Math.max(
        0,
        Math.floor((Date.now() - new Date(session.entryTime).getTime()) / 60_000),
      )
      const totalHours = Math.ceil(totalMinutes / 60)
      let dayH = 0, nightH = 0
      for (let i = 0; i < totalHours; i++) {
        const h = new Date(new Date(session.entryTime).getTime() + i * 3_600_000).getHours()
        if (h >= 6 && h < 18) dayH++
        else nightH++
      }
      fee = dayH * DAY_RATE + nightH * NIGHT_RATE + SURCHARGE
    }

    sessionsV2[idx] = {
      ...session,
      status: 'Completed',
      isPaid: true,
      exitTime: new Date().toISOString(),
      totalFee: fee,
    }

    // Decrement inside: mark corresponding slot Available if found
    slotsV2 = slotsV2.map((s) =>
      s.slotCode === session.actualSlotCode && s.status === 'Occupied'
        ? { ...s, status: 'Available' as const }
        : s,
    )

    return HttpResponse.json({
      success: true,
      paymentId: `PAY-${Date.now()}`,
      status: 'Success',
      barrierOpen: true,
    })
  }),

  // Auth endpoints — khớp hợp đồng BE: nhận `username`, trả envelope { success, message, data:LoginResponse }.
  http.post('/api/auth/login', async ({ request }) => {
    const { username, password } = (await request.json()) as { username: string; password: string }
    void password // demo: bỏ qua kiểm tra mật khẩu
    // Khớp theo email/username; không khớp → suy ra role theo từ khoá.
    const account = findAccountByEmail(username) ?? accountForUnknownEmail(username)
    return HttpResponse.json({
      success: true,
      message: 'OK',
      data: { token: 'mock-jwt-token', username: account.email },
    })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as {
      username: string
      email: string
      phoneNumber?: string
      fullName: string
      roleName?: string
    }
    const id = `u-driver-${Date.now()}`
    // Persist so the new driver's profile resolves immediately.
    usersStore[id] = { id, email: body.email, phone: body.phoneNumber ?? '', fullName: body.fullName }
    return HttpResponse.json(
      {
        success: true,
        message: 'Đăng ký thành công',
        data: { token: 'mock-jwt-token', username: body.username, roleName: 'Driver' },
      },
      { status: 201 },
    )
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  // ── Gate / Camera simulator endpoints ─────────────────────────────────────────

  http.post('/api/gate/entry/scan', async ({ request }) => {
    const body = (await request.json()) as {
      licensePlate: string
      failureRate?: number
      forceFailure?: string
    }
    const { licensePlate, failureRate = 0, forceFailure } = body

    // Scan failure
    if (forceFailure === 'SCAN_FAILED' || Math.random() * 100 < failureRate) {
      return HttpResponse.json({
        admitted: false,
        reason: 'SCAN_FAILED',
        message: 'Không nhận diện được biển số. Vui lòng nhập tay.',
      })
    }

    // Lot full check
    const availability = computeAvailability(slotsV2)
    const totalHeadroom = availability.byVehicleType.reduce(
      (sum, vt) => sum + vt.walkInHeadroom,
      0,
    )
    if (forceFailure === 'FULL' || totalHeadroom <= 0) {
      return HttpResponse.json({
        admitted: false,
        reason: 'FULL',
        message: 'Bãi xe đã đầy. Không thể tiếp nhận xe mới.',
      })
    }

    // Check for matching confirmed reservation
    const resIdx = reservationsV2.findIndex(
      (r) =>
        r.licensePlate.toLowerCase() === licensePlate.toLowerCase() &&
        r.status === 'Confirmed',
    )
    const reservationMatched = resIdx !== -1
    if (reservationMatched) {
      reservationsV2[resIdx] = { ...reservationsV2[resIdx], status: 'CheckedIn' }
    }

    // Pick an advisory available slot
    const availableSlot = slotsV2.find((s) => s.status === 'Available')
    const suggestedSlotCode = availableSlot?.slotCode

    // Create new session
    const sessionId = `sess-${Date.now()}`
    const newSession: ParkingSession = {
      sessionId,
      reservationId: reservationMatched ? reservationsV2[resIdx].reservationId : null,
      vehicleTypeId: 'vt-car',
      licensePlate,
      assignedSlotCode: suggestedSlotCode,
      entryTime: new Date().toISOString(),
      isPaid: false,
      status: 'Admitted',
    }
    sessionsV2.push(newSession)

    // Mark the advisory slot occupied so next entry gets a different suggestion
    if (availableSlot) {
      slotsV2 = slotsV2.map((s) =>
        s.slotCode === availableSlot.slotCode ? { ...s, status: 'Occupied' as const } : s,
      )
    }

    return HttpResponse.json({
      admitted: true,
      sessionId,
      reservationMatched,
      suggestedSlotCode,
      message: `Xe vào thành công.${suggestedSlotCode ? ` Chỗ đỗ gợi ý: ${suggestedSlotCode}` : ''}`,
    })
  }),

  http.post('/api/gate/exit/scan', async ({ request }) => {
    const body = (await request.json()) as {
      licensePlate: string
      failureRate?: number
    }
    const { licensePlate, failureRate = 0 } = body

    // Scan failure → 500
    if (Math.random() * 100 < failureRate) {
      return HttpResponse.json(
        { success: false, message: 'Lỗi quét biển số cổng ra.', errorCode: 'SCAN_ERROR' },
        { status: 500 },
      )
    }

    // Find active session
    const OPEN_STATUSES = ['Admitted', 'Parked', 'Moved']
    const session = sessionsV2.find(
      (s) =>
        OPEN_STATUSES.includes(s.status) &&
        s.licensePlate.toLowerCase() === licensePlate.toLowerCase(),
    )
    if (!session) {
      return HttpResponse.json(
        { success: false, message: 'Không tìm thấy xe trong bãi.', errorCode: 'NOT_FOUND' },
        { status: 404 },
      )
    }

    const entryTime = new Date(session.entryTime)
    const now = new Date()
    const totalMs = now.getTime() - entryTime.getTime()
    const totalHours = Math.max(1, Math.ceil(totalMs / 3_600_000))

    // Day/night fee: 10,000 VND/hour 06:00–18:00, 15,000 VND/hour 18:00–06:00
    let dayH = 0
    let nightH = 0
    for (let i = 0; i < totalHours; i++) {
      const h = new Date(entryTime.getTime() + i * 3_600_000).getHours()
      if (h >= 6 && h < 18) dayH++
      else nightH++
    }
    const totalFee = dayH * 10_000 + nightH * 15_000
    const durationHours = Math.round((totalMs / 3_600_000) * 100) / 100

    return HttpResponse.json({
      sessionId: session.sessionId,
      licensePlate: session.licensePlate,
      entryTime: session.entryTime,
      durationHours,
      totalFee,
      isPaid: false,
      paymentMethods: ['Cash', 'QR'],
    })
  }),

  http.post('/api/gate/force-checkin', async ({ request }) => {
    const body = (await request.json()) as { licensePlate: string }
    const { licensePlate } = body

    // Find any reservation for this plate and update it
    const resIdx = reservationsV2.findIndex(
      (r) => r.licensePlate.toLowerCase() === licensePlate.toLowerCase(),
    )
    if (resIdx !== -1) {
      reservationsV2[resIdx] = {
        ...reservationsV2[resIdx],
        licensePlate,
        status: 'CheckedIn',
      }
    }

    // Create session
    const sessionId = `sess-force-${Date.now()}`
    const newSession: ParkingSession = {
      sessionId,
      reservationId: resIdx !== -1 ? reservationsV2[resIdx].reservationId : null,
      vehicleTypeId: 'vt-car',
      licensePlate,
      entryTime: new Date().toISOString(),
      isPaid: false,
      status: 'Admitted',
    }
    sessionsV2.push(newSession)

    // Log MANUAL_OVERRIDE incident
    const incident: Incident = {
      incidentId: `inc-force-${Date.now()}`,
      issueType: 'MANUAL_OVERRIDE',
      sessionId,
      description: `Force check-in cho biển số ${licensePlate} bởi nhân viên.`,
      createdAt: new Date().toISOString(),
      status: 'Open',
    }
    incidentsV2.push(incident)

    return HttpResponse.json({
      admitted: true,
      sessionId,
      message: `Force check-in thành công cho xe ${licensePlate}.`,
    })
  }),

  http.post('/api/camera/slot-occupied', async ({ request }) => {
    const body = (await request.json()) as {
      slotCode: string
      licensePlate?: string
    }
    const { slotCode, licensePlate } = body

    const OPEN_STATUSES = ['Admitted', 'Parked', 'Moved']

    // Find matching session by licensePlate first, then by assignedSlotCode
    const sessIdx = sessionsV2.findIndex((s) => {
      if (!OPEN_STATUSES.includes(s.status)) return false
      if (licensePlate && s.licensePlate.toLowerCase() === licensePlate.toLowerCase()) return true
      if (s.assignedSlotCode === slotCode) return true
      return false
    })

    let matched = sessIdx !== -1
    if (matched) {
      sessionsV2[sessIdx] = {
        ...sessionsV2[sessIdx],
        status: 'Parked',
        actualSlotCode: slotCode,
        parkedTime: new Date().toISOString(),
      }
    } else {
      // No matching session — create UNMAPPED_OCCUPANCY incident
      const incident: Incident = {
        incidentId: `inc-unmap-${Date.now()}`,
        issueType: 'UNMAPPED_OCCUPANCY',
        slotCode,
        description: `Camera phát hiện xe tại ${slotCode} không khớp phiên nào.${licensePlate ? ` Biển số: ${licensePlate}` : ''}`,
        createdAt: new Date().toISOString(),
        status: 'Open',
      }
      incidentsV2.push(incident)
    }

    // Update slot status
    slotsV2 = slotsV2.map((s) =>
      s.slotCode === slotCode ? { ...s, status: 'Occupied' as const } : s,
    )

    return HttpResponse.json({ matched, slotStatus: 'Occupied' })
  }),

  http.post('/api/camera/slot-vacated', async ({ request }) => {
    const body = (await request.json()) as { slotCode: string }
    const { slotCode } = body

    // Find session occupying this slot
    const sessIdx = sessionsV2.findIndex(
      (s) => s.actualSlotCode === slotCode && ['Parked', 'Admitted', 'Moved'].includes(s.status),
    )
    const matched = sessIdx !== -1
    if (matched) {
      sessionsV2[sessIdx] = {
        ...sessionsV2[sessIdx],
        status: 'Moved',
        movedTime: new Date().toISOString(),
      }
    }

    // Free the slot
    slotsV2 = slotsV2.map((s) =>
      s.slotCode === slotCode && s.status === 'Occupied'
        ? { ...s, status: 'Available' as const }
        : s,
    )

    return HttpResponse.json({ matched, slotStatus: 'Available' })
  }),
]
