# API Reference - Parking Driver Application

This document provides a comprehensive reference for the backend APIs consumed by the `parking-driver` frontend application. All requests are authenticated via a JWT Bearer token unless otherwise specified. 

The `api.ts` wrapper automatically handles prefixing endpoints with the `NEXT_PUBLIC_API_BASE` and extracting data from the standard `{ success, message, data }` Spring Boot envelope.

---

## 1. Authentication & Profile

### `GET /driver/profile`
Retrieves the profile information of the currently authenticated driver. The user is identified by the JWT token.
- **Request Parameters**: None.
- **Response (`ProfileDTO`)**:
  ```json
  {
    "username": "string",
    "fullName": "string | null",
    "email": "string | null",
    "phoneNumber": "string | null",
    "roleName": "string | null",
    "status": "string | null"
  }
  ```

### `PUT /driver/profile`
Updates the profile information of the currently authenticated driver.
- **Request Body**:
  ```json
  {
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string"
  }
  ```
- **Response**: Updated `ProfileDTO` object (same as `GET /driver/profile`).

---

## 2. Parking Information & Availability

### `GET /driver/parking-info`
Retrieves public system configuration, pricing policies, and real-time slot availability for all vehicle types. This is the single source of truth for the driver booking form.
- **Request Parameters**: None.
- **Response (`ParkingInfoResponse`)**:
  ```json
  {
    "parkingName": "string",
    "operatingHours": "string",
    "totalAvailableSlots": "number",
    "availabilityByVehicleType": [
      {
        "vehicleTypeId": "number",
        "vehicleTypeName": "string",
        "totalSlots": "number",
        "availableSlots": "number"
      }
    ],
    "pricingPolicies": [
      {
        "vehicleTypeName": "string",
        "basePrice": "number",
        "baseHours": "number",
        "extraHourPrice": "number",
        "nightSurcharge": "number | null"
      }
    ]
  }
  ```

---

## 3. Reservations

### `POST /driver/reservations`
Creates a new parking reservation for the driver.
- **Request Body**:
  ```json
  {
    "vehicleTypeId": "number",
    "licensePlate": "string",
    "expectedEntryTime": "string (ISO 8601)",
    "expectedExitTime": "string (ISO 8601)"
  }
  ```
- **Error Response**: Returns a `409 Conflict` (with code `QUOTA_FULL`) if the parking lot has no available headroom for the requested duration.
- **Response (`ReservationDTO`)**:
  ```json
  {
    "reservationId": "number",
    "userId": "number | null",
    "vehicleTypeId": "number | null",
    "vehicleTypeName": "string | null",
    "licensePlate": "string",
    "expectedEntryTime": "string (ISO 8601)",
    "expectedExitTime": "string (ISO 8601)",
    "depositAmount": "number",
    "depositStatus": "string",
    "status": "string (Pending | Confirmed | CheckedIn | Fulfilled | Cancelled | Expired)",
    "createdAt": "string (ISO 8601)"
  }
  ```

### `GET /driver/reservations/quote`
Prices a booking window **without** creating a reservation — the FE calls this instead of duplicating the fee/deposit formula, so Manager pricing/deposit-config changes are reflected automatically.
- **Query Parameters**:
  - `vehicleTypeId`: number
  - `entryTime`: string (ISO LocalDateTime, e.g. `2026-07-14T10:00:00`)
  - `exitTime`: string (ISO LocalDateTime)
- **Response (`ReservationQuoteDTO`)**:
  ```json
  {
    "estimatedFee": "number",
    "depositAmount": "number"
  }
  ```
  `depositAmount` = `depositPercent × estimatedFee` (server-side), the exact amount PayOS will charge for the deposit.

### `GET /driver/reservations/my`
Retrieves a list of all historical and active reservations belonging to the authenticated driver.
- **Request Parameters**: None.
- **Response**: Array of `ReservationDTO` objects.
  ```json
  [
    {
      "reservationId": "number",
      "licensePlate": "string",
      // ... same as ReservationDTO
    }
  ]
  ```

### `PATCH /driver/reservations/{id}/cancel`
Cancels a specific upcoming reservation.
- **Path Parameters**: 
  - `id`: The numeric ID of the reservation to cancel.
- **Request Body**: None.
- **Response**: The updated `ReservationDTO` object with `status` set to `CANCELLED`.

---

## 4. Payments (PayOS & Deposits)

### `POST /driver/payments/payos/create-link`
Generates a real PayOS payment link and QR code (VietQR / EMVCo) for a reservation deposit or session checkout.
- **Request Body**:
  ```json
  {
    "type": "string ('DEPOSIT' | 'PARKING')",
    "id": "number (reservationId or sessionId)"
  }
  ```
- **Response (`PayosLinkResponse`)**:
  ```json
  {
    "checkoutUrl": "string (URL to redirect user to PayOS)",
    "qrCode": "string (VietQR payload string to render as a QR image)",
    "orderCode": "number",
    "amount": "number"
  }
  ```

### `POST /driver/reservations/{id}/confirm-deposit`
Confirms that the booking deposit has been paid. The backend sets the `depositStatus` to `Paid` and updates the reservation status from `Pending` to `Confirmed`. Used typically upon returning from a successful PayOS flow or a mock demo QR scan.
- **Path Parameters**: 
  - `id`: The numeric ID of the reservation.
- **Request Body**: None.
- **Response**: 
  ```json
  {
    "success": true
  }
  ```
