# Frontend Refactor Plan — căn theo BL v3.1

> Mục tiêu: đưa FE từ bản **mock-first, multi-lot, 2 hệ type** về đúng **scope v3.1** + nối được BE thật.
> Đọc kèm: `Obsidian/Parking/BL_v3.1.md`.

> **UI đã có sẵn — refactor là lớp _dữ liệu/hợp đồng_, không vẽ lại giao diện.**
> ~40 component (Stitch) đã dựng xong. Các phase dưới cố tình thiên về *functions/plumbing* vì mục tiêu là **làm cho UI hiện có bind được API thật**. UI chỉ đổi ở chỗ: (a) shape response đổi → sửa data-binding; (b) feature bị cắt → gỡ component. **Đích cuối = sẵn sàng nối BE** (xem §7).

---

## 1. Hiện trạng (vì sao cần refactor)

| # | Vấn đề | Bằng chứng | Ảnh hưởng |
|---|---|---|---|
| H1 | **2 hệ type song song** | `@/types` (legacy: `Reserved`, `VehicleType='car'`, `Facility/Floor/Zone`, slot-owns-booking) dùng ở **9 file**; `@/types/model` (capacity model) ở **62 file** | Lẫn lộn, dễ bug; `dashboard/page.tsx` vẫn tính `OccupancyStats.reserved` |
| H2 | **Mô hình multi-lot** | `parkingLotId`/`lotId` ở **33 chỗ** (hooks, components, store, model) | Trái v3.1 (1 tòa); kéo theo path `/parking-lots/:id/...` không khớp BE |
| H3 | **Hook bypass API seam** | `useSessions`, `useSlots`, `usePayParking`, `store/auth.ts` gọi thẳng `fetch('/api/...')` | Không repoint sang BE bằng env được; mock dính cứng |
| H4 | **Hook trùng** | `useSessions` ↔ `useSessionsV2`, `useSlots` ↔ `useSlotMap`/`useAvailability` | Hai nguồn sự thật cho cùng dữ liệu |
| H5 | **Auth lệch BE** | `store/auth.ts`: login bằng `email`, body `{email,password}`, đọc `{user,token}`, token nhét `sessionStorage` **không gắn vào request**, `User.parkingLotId` | Không đăng nhập được BE; mọi call authed fail |
| H6 | **Mock 3 tầng** | MSW (`src/mocks`) + **9 component** tự `mockData.ts` + nhiều `types.ts` riêng | Sửa 1 nghiệp vụ phải sờ 3 nơi |
| H7 | **Component/feature ngoài scope** | `gate-camera-simulator` (camera dò ô), `slot-map/CapacityCrashDialog`, `occupancy-dashboard` (time-series), `driver/profile/SavedVehicles`, `my-bookings/FindCarBox` (driver tìm xe) | v3.1 đã bỏ/đổi các phần này |
| H8 | **constants.ts trùng + lỗi thời** | `SLOT_STATUS_LABELS` vs `_V2`, `PAYMENT_METHOD_LABELS` vs `_V2`, còn `Reserved`, `WindshieldQR`, `TTL_*`, `softHold` | Nhãn sai scope |
| H9 | **"2 app" mới làm nửa vời** | Driver đã có shell riêng (`/driver/*`, `DriverAuth`) nhưng vẫn chung project/route-guard `roles.ts` với nội bộ | Chưa tách rõ như v3.1 |
| H10 | **Icon 3 hệ** | `material-symbols-outlined` + `material-icons` + `lucide-react` cùng lúc (`layout.tsx`) | Tải dư, không nhất quán |

**Điểm tốt giữ lại:** `src/lib/api.ts` (seam đúng kiểu), React Query setup (`providers.tsx`), `ui/*` (shadcn), cấu trúc component theo feature, `@/types/model` đã gần đúng scope (đã có `SlotStatus` không `Reserved`).

---

## 2. Nguyên tắc refactor

1. **`@/types/model` là nguồn sự thật duy nhất** → xoá `@/types` legacy.
2. **Mọi I/O đi qua `api.ts`** → cấm `fetch('/api')` rải rác.
3. **1 tòa**: xoá sạch `parkingLotId/lotId`.
4. **Bám path BE** role-namespaced (`/api/{role}/...`) + envelope `{success,message,data}`.
5. **Tách 2 app** bằng Next **route groups** trước (nhẹ), tách repo sau nếu cần.
6. Đụng tới đâu **xoá mock/feature ngoài scope** tới đó.

---

## 3. Kế hoạch theo phase (thứ tự ưu tiên)

### Phase 0 — Hợp đồng API & Auth *(blocker, làm trước hết)*
- [ ] `lib/api.ts`: sau `res.json()`, **unwrap `data`**; nếu `success===false` → throw `AppError(message)`; **đính `Authorization: Bearer <token>`** lấy từ auth store.
- [ ] `store/auth.ts`: đổi `login(email,…)` → **`login(username,…)`**, body `{username,password}`, đọc `LoginResponse {token,username,roleName}`; **lưu token trong store (persist)**; map `roleName`→`UserRole`; **bỏ `parkingLotId`**.
- [ ] Chuyển `useSessions`, `useSlots`, `usePayParking`, và auth store sang `api.*` (bỏ raw `fetch`).
- [ ] Quyết mock: dùng **MSW theo `NEXT_PUBLIC_API_BASE`**; xoá Next route `app/api/auth/*` (trùng vai trò với MSW).
- **File:** `lib/api.ts`, `store/auth.ts`, `hooks/useSessions.ts`, `useSlots.ts`, `usePayParking.ts`, `app/api/**`.
- **Rủi ro:** chạm mọi luồng auth → làm nhánh riêng, smoke-test login từng role.

### Phase 1 — Hợp nhất type & bỏ multi-lot
- [ ] Gộp những gì còn dùng từ `@/types` vào `@/types/model`, sửa **9 import** legacy, **xoá `src/types/index.ts`**.
- [ ] Bỏ `Facility/Floor/Zone`, `VehicleType='car'`, `Booking(slot-owned)`, `SlotStatus.Reserved`, `ExceptionType` cũ.
- [ ] Xoá `parkingLotId/lotId` ở **33 chỗ** (model, hooks, components, store). `ParkingLot`, `LotAvailability.parkingLotId`, `Slot.parkingLotId`… → bỏ.
- [ ] Sửa `dashboard/page.tsx`: bỏ field `reserved` khỏi `OccupancyStats`.
- [ ] `constants.ts`: xoá bộ nhãn v1 trùng + `Reserved`, `WindshieldQR`, `TTL_*`, `softHoldMinutes`; giữ `_V2` (đổi tên bỏ hậu tố `_V2`).
- **Rủi ro:** lan rộng nhưng cơ học; nhờ `tsc --noEmit` bắt lỗi.

### Phase 2 — Tách 2 app (route groups)
- [ ] Tạo `app/(internal)/` (admin/manager/staff) dùng `DashboardLayout/ProtectedLayout`, và `app/(driver)/` dùng shell driver riêng.
- [ ] Di chuyển: `dashboard, capacity, slots, sessions, bookings, incidents, occupancy, quota, reports, exit-payment, simulator` → `(internal)`; `driver/*` → `(driver)`.
- [ ] `lib/roles.ts`: tách `canAccess` thành 2 guard nhỏ (internal: Admin/Manager/Staff; driver: Driver). Bỏ điều hướng chéo.
- [ ] (Tuỳ chọn về sau) tách hẳn 2 Next project nếu thầy/PO yêu cầu 2 deploy.
- **Rủi ro:** chủ yếu là di chuyển file + sửa import path.

### Phase 3 — Dọn theo scope nghiệp vụ
| Feature | Hành động |
|---|---|
| `gate-camera-simulator/*` | **Rút gọn** còn 1 panel "Simulated Camera" (Staff): ghi **ô thực tế** khi xe đậu. Bỏ `FloorCameraPanel` AI, `FailureRateSlider`, logic dò ô. |
| `slot-map/CapacityCrashDialog` | **Xoá** (bỏ capacity-crash tự động). |
| `occupancy-dashboard/*` | **Tạm ẩn/bỏ** nếu BE không có time-series; hoặc đổi sang đọc `/manager/reports/traffic`. |
| `driver/profile/SavedVehicles` | **Xoá** (SRS không có). Giữ `AccountForm` ở mức xem hồ sơ. |
| `driver/my-bookings/FindCarBox` | **Xoá** (Driver không tìm xe). |
| `reports/OccupancyCurve` | Soát lại theo dữ liệu BE thật (revenue/traffic). |
| `incidents/*` | **Rút gọn**: Staff tạo + Manager xem; bỏ `ResolveIncidentDialog` nếu cắt workflow resolve. |
| Pricing UI (Manager) | Bảng giá **theo giờ** + ô cấu hình `depositPercent`; `overstayRate` default. Bỏ ngày/đêm, phí mất thẻ. |
| `driver/page.tsx` | Mục "Tìm xe của tôi" đang `enabled:false` → **xoá hẳn**; "Hồ sơ" → bật ở mức tối thiểu. |

### Phase 4 — Nối BE thật (cuốn chiếu theo từng màn hình)
> Đây là bước **wiring** thật: với mỗi màn, đổi path hook → BE, bind lại theo response thật, xử lý loading/empty/error. Làm dần từng màn, **không cần "big bang"**.
- [ ] Bảng ánh xạ path (làm trong hooks). Một số mẫu:

| Hook hiện tại | → BE route |
|---|---|
| `/parking-lots/:id/availability` | `GET /api/manager/dashboard/floors` + endpoint availability mới |
| `/vehicle-types` | `GET /api/manager/vehicle-types` |
| `/sessions/find?plate=` | `GET /api/staff/sessions/search?licensePlate=` |
| `/sessions/active` | `GET /api/staff/sessions/active` |
| `/reservations/user/:id` | `GET /api/driver/reservations/my` |
| `/reservations/:id/cancel` (POST) | `PATCH /api/driver/reservations/{id}/cancel` |
| `/admin/quotas` | `/api/manager/booking-quotas` |
| `/admin/lots/:id/reports?from=&to=` | `/api/manager/reports/revenue?fromDate=&toDate=` |
- [ ] Đổi param: `plate→licensePlate`, `from→fromDate`/`to→toDate`; verb `POST→PATCH` chỗ cancel.
- [ ] Mỗi màn: bind component theo **DTO thật** (chỗ shape đổi thì sửa props), thêm loading/empty/error nhất quán.
- [ ] Tắt MSW cho màn đã nối (set `NEXT_PUBLIC_API_BASE` về BE), QA từng màn rồi mới sang màn kế.

### Phase 5 — Dọn dư & nhất quán
- [ ] Gộp hook trùng: bỏ `useSessions` (giữ `useSessionsV2` → đổi tên `useSessions`); gộp `useSlots` vào `useSlotMap/useAvailability`.
- [ ] Gỡ **9 `mockData.ts`** trong component; chuyển fixture còn cần về `src/mocks` (1 nguồn).
- [ ] Chuẩn hoá **1 hệ icon** (đề xuất `lucide-react`); bỏ `material-icons`/`material-symbols` trong `layout.tsx`.
- [ ] Soát loading/empty/error state qua `ErrorBoundary` + skeleton chung.

---

## 4. Giữ / Sửa / Bỏ — tổng hợp component

- **GIỮ (ít sửa):** `ui/*`, `auth/*`, `dashboard/*`, `reservations/*`, `quota-management/*`, `reports/*` (sau khi map data), `slot-map/*` (trừ CrashDialog), `active-sessions/*`.
- **SỬA NHIỀU:** `capacity-dashboard/*` (bỏ lot, bỏ outstanding hiển thị nếu rườm), `exit-payment/*` (flat fee), `driver/book/*` (cọc + flat fee), `gate-camera-simulator/*` (rút gọn), `incidents/*` (rút gọn).
- **BỎ:** `slot-map/CapacityCrashDialog`, `driver/profile/SavedVehicles`, `driver/my-bookings/FindCarBox`, `occupancy-dashboard/*` (nếu BE không hỗ trợ), các `mockData.ts` lẻ, `src/types/index.ts`, `app/api/auth/*`.

---

## 5. Thứ tự & rủi ro

```
Phase 0 (auth/seam)  ──►  Phase 1 (type/lot)  ──►  Phase 2 (2 app)
        │                                               │
        └──────────────►  Phase 4 (path map) ◄──────────┘
                                  │
                    Phase 3 (scope) ──► Phase 5 (dọn dư)
```
- **0 & 1 là nền** — không làm trước thì các phase sau vô nghĩa.
- Mỗi phase 1 nhánh git riêng + chạy `npm run type-check` trước khi merge.
- Phase 3 nên đi **song song** với việc BE bổ sung endpoint (camera ghi ô, availability, pricing config) để FE map vào đồ thật.

## 6. Ước lượng nhanh (1 dev)
| Phase | Công | Quy mô |
|---|---|---|
| 0 | Auth + seam + bỏ raw fetch | ~0.5 ngày |
| 1 | Hợp nhất type, bỏ lot | ~1 ngày (lan rộng) |
| 2 | Tách 2 app (route groups) | ~0.5 ngày |
| 3 | Dọn scope feature | ~1–1.5 ngày |
| 4 | Map path/param BE | ~0.5 ngày (cuốn chiếu theo màn) |
| 5 | Dọn dư, icon, hook trùng | ~0.5 ngày |

---

## 7. Trạng thái đích — Definition of Ready (để nối BE)

Refactor coi như **xong & sẵn sàng wiring** khi tất cả đúng:

- [ ] `api.ts` unwrap `{success,message,data}` + tự gắn `Authorization: Bearer`.
- [ ] Auth đăng nhập bằng `username`, lưu JWT trong store; không còn `email`/`mock-jwt-token`.
- [ ] **1 hệ type** (`@/types/model`), **0 chỗ** `parkingLotId/lotId`.
- [ ] **Không còn** `fetch('/api/...')` rải rác — tất cả qua `api.*`.
- [ ] Path hook trỏ đúng route BE, **bật/tắt mock bằng `NEXT_PUBLIC_API_BASE`**.
- [ ] Mỗi màn có loading/empty/error chuẩn; feature ngoài scope đã gỡ.

> **Quy ước "ready":** sau refactor, nối BE chỉ còn là *đổi `NEXT_PUBLIC_API_BASE`* + bind theo DTO thật cho từng màn (Phase 4). Không phải làm lại UI.

> Gợi ý: bắt đầu **Phase 0** ngay (mở khoá tích hợp BE), làm song song với BE #1/#3 (ghi ô thực tế + sửa cọc) đã chốt trong BL v3.1. Notes cho team BE: xem `parking/BE/BACKEND-API-NOTES.md`.

---

## 8. Feature BẮT BUỘC sau refactor — Quản lý Giá (Manager)

> **Bắt buộc**, không tuỳ chọn. BE đã có API (`/api/manager/pricing-policies`, role MANAGER/ADMIN); **FE hiện CHƯA có màn này**.

- [ ] Hook `usePricing` (list/create/update/deactivate) nối `/api/manager/pricing-policies`.
- [ ] Màn **"Quản lý Giá"** cho Manager: bảng giá **theo giờ** (rate/giờ) + cấu hình **`depositPercent`** (+ `overstayRate` default) — khớp BACKEND-API-NOTES §A5/§B/§C2.
- [ ] Thêm nav item "Giá" vào sidebar Manager + route guard.
- [ ] Phụ thuộc BE: gỡ field thừa `nightSurcharge`/`lostTicketFee`, thêm fee-config (xem `BE/BACKEND-API-NOTES.md`).
- Làm **sau khi xong Phase 1–5** (cần `@/types/model` + API seam đã chuẩn).
