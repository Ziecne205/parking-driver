# parking-driver — Nối API (Phase 4)

> App **tài xế** (chỉ role Driver). Hiện chạy **mock MSW 100%**.
> Nối API = (1) bật chế độ gọi server, (2) ở mỗi **hook** đổi path/param + map DTO, (3) tắt mock theo màn.
> Đã làm sẵn (Phase 0): **`apiFetch` tự unwrap `{success,message,data}` + gắn `Authorization: Bearer`**, đăng nhập bằng **username**.
> **Nguyên tắc:** chỉ sửa **hook** (+ type nếu cần) — **không đụng UI**.

---

## 0. Bật chế độ gọi server (làm trước)

1. **Env:** đặt `NEXT_PUBLIC_API_BASE=http://localhost:8080/api`. `apiFetch` prefix base này thay cho `/api`.
2. **Tắt MSW khi đã trỏ server** — `src/components/providers.tsx`:
   ```ts
   // trước: bật mock mọi lúc trong development
   if (process.env.NODE_ENV === 'development') { ... initMocks() }
   // sau: chỉ bật mock khi CHƯA set base
   if (!process.env.NEXT_PUBLIC_API_BASE) { ... initMocks() }
   ```
   → không set env = chạy mock; set env = gọi server thật. 1 công tắc.
3. **Auth & userId:** đăng nhập trả `{token, username, roleName}` — **không có `userId`**. Các màn hiện truyền `userId` (lấy từ `user.id`) sẽ chuyển sang **endpoint dựa trên JWT** (server tự nhận user từ token) — xem cột "sửa thêm" ở dưới.

---

## 1. Sửa theo từng hook

> `path mới` = path sau khi prefix `NEXT_PUBLIC_API_BASE`. Map DTO làm **ngay trong hook**.

| Màn / Hook | File | Path hiện tại → **path mới** | Sửa thêm ở hook |
|---|---|---|---|
| **Đăng nhập / Đăng ký** | `store/auth.ts` | `/auth/login`, `/auth/register` | đã khớp; register map `email→username` tạm + `phoneNumber` |
| **Loại xe + Chỗ trống** (màn Đặt chỗ) | `useAvailability.ts` (`useVehicleTypes`, `useAvailability`) | `/vehicle-types`, `/availability` → **`/driver/parking-info`** | gọi 1 endpoint công khai; map: `availabilityByVehicleType` → headroom, lấy danh sách loại xe + bảng giá từ `pricingPolicies` |
| **Đặt chỗ – tạo** | `useReservations.ts` (`useCreateReservation`) | `/reservations` → **`/driver/reservations`** (POST) | body `{vehicleTypeId,licensePlate,expectedEntryTime,expectedExitTime}` |
| **Đặt chỗ của tôi** | `useMyReservations.ts` | `/reservations/user/${userId}` → **`/driver/reservations/my`** | **bỏ tham số `userId`** (server lấy user từ JWT); map `Reservation` |
| **Đặt chỗ – huỷ** | `useReservations.ts` (`useCancelReservation`) | `POST /reservations/{id}/cancel` → **`PATCH /driver/reservations/{id}/cancel`** | đổi verb POST→PATCH |
| **Hồ sơ** | `useProfile.ts` (`useProfile`, `useUpdateProfile`) | `/users/${userId}` (GET/PUT) → **`/driver/profile`** (GET/PUT) | **bỏ `userId`** (JWT); chỉ cần `{username,fullName,phoneNumber,email}` |
| **Trả cọc** | `usePayDeposit.ts` | `/payments` `{paymentType:'Deposit',…}` → **`/driver/payments/checkout`** | body `{reservationId, paymentMethod}` (hoặc luồng PayOS nếu dùng) |

### Lưu ý — export thừa trong vài hook (không dùng ở app driver)
- `useAvailability.ts`: `useLotSlots` (`/slots-map`) + `useSetMaintenance` (`/admin/slots/maintenance`) — của Slot Map nội bộ, **driver không dùng** → bỏ qua khi nối (có thể xoá cho gọn).
- `useReservations.ts`: hàm list `useReservations()` (`/reservations?status=`) — driver dùng `/my`, không dùng hàm này → bỏ qua.
- `useProfile.ts`: `useSavedVehicles` / `useAddVehicle` / `useRemoveVehicle` — saved-vehicles đã bỏ ở Phase 3 → dead, bỏ qua.

---

## 2. Checklist cuốn chiếu (xong màn nào QA màn đó)

- [x] **B0** — env (`.env.local` = `NEXT_PUBLIC_API_BASE`) + MSW tự tắt khi có base (`providers.tsx`)
- [x] Đăng nhập / Đăng ký — `store/auth.ts` (đã khớp; login gửi `{username,password}`, BE nhận qua `identifier`)
- [x] Đặt chỗ — loại xe + chỗ trống — `useAvailability.ts` gọi `/driver/parking-info` (1 query, 2 `select`)
- [x] Đặt chỗ — tạo — `useReservations.ts` POST `/driver/reservations` (body `vehicleTypeId:number`); quota-full suy từ message → `code:'QUOTA_FULL'`
- [x] Đặt chỗ của tôi — `useMyReservations.ts` GET `/driver/reservations/my` + `mapReservation`
- [x] Đặt chỗ — huỷ — `useReservations.ts` PATCH `/driver/reservations/{id}/cancel`
- [x] Hồ sơ — `useProfile.ts` GET/PUT `/driver/profile` (JWT) + `mapProfile`; đồng bộ vào auth store
- [x] Trả cọc — `usePayDeposit.ts` POST `/driver/payments/mock-callback` (Confirmed; PayOS thật cần key)

### ⚠️ Cần lưu ý sau khi nối (BE gaps)
- **Hồ sơ tài xế:** đã thêm BE `GET/PUT /api/driver/profile` (trả `ProfileDTO`, KHÔNG lộ passwordHash). Login vẫn chỉ trả `{token,username,roleName}` nên header hiển thị username tới khi mở màn Hồ sơ (lúc đó fetch + cập nhật store).
- **`vehicleTypeId`:** đã thêm vào `/driver/parking-info` (`SlotAvailabilityDTO`) ở BE để form đặt chỗ có id gửi lên.
- **Trả cọc** đi qua `mock-callback` (demo, hoạt động ngay). Muốn PayOS thật: `POST /driver/payments/payos/create-link {type:'DEPOSIT',id}` → redirect `checkoutUrl`; cần điền key (xem `application-local.yml.example` ở BE) + 1 route `/payment/success` bên FE.
- **QUOTA_FULL:** BE nay trả `errorCode: "QUOTA_FULL"` trong envelope lỗi → hook create dựa vào `e.code` (regex `/quota/` chỉ là fallback).

---

## 3. Mẫu sửa 1 hook

```ts
// useMyReservations — trước (mock, theo userId):
queryFn: () => api.get<Reservation[]>(`/reservations/user/${userId}`)

// sau (server, theo JWT): bỏ userId, đổi path
queryFn: () => api.get<Reservation[]>('/driver/reservations/my')
```
Chỗ nào shape lệch nhiều → viết 1 hàm `map...()` nhỏ trong hook. UI giữ nguyên.
