# Parking Driver FE - Business Logic & API Integration

This document outlines the business logic handled by the `parking-driver` front-end application and how it integrates with the backend APIs. Unlike the internal staff application, this app is purely driver-facing and is responsible for the end-to-end customer booking and payment experience.

## Overview of App Structure
The app is organized under `src/app/driver/` with the following main modules:
- `/auth`: User authentication.
- `/profile`: Driver profile management.
- `/book`: The reservation booking flow.
- `/my-bookings`: Driver's personal reservation history and management.
- `/payment`: Deposit payment integration (via PayOS).

## 1. Authentication & Profile
**Hooks:** `useProfile.ts`
**Endpoints:** `GET /driver/profile`, `PUT /driver/profile`

*   **Profile Management:** Drivers can view and update their personal information (Full Name, Phone Number, Email). The server identifies the user directly from the JWT token, so no `userId` is passed in the request body.
*   **State Syncing:** Changes are mirrored directly to the frontend `authStore` to keep the UI (e.g., avatar and header name) in sync without requiring a page reload.

## 2. Parking Information & Availability
**Hooks:** `useAvailability.ts`
**Endpoints:** `GET /driver/parking-info`

*   **Single Source of Truth:** The driver app does not hit the internal `/manager/vehicle-types` or `/manager/availability` endpoints. Instead, it relies on a single public endpoint (`/driver/parking-info`) which returns a `ParkingInfoResponse`.
*   **Availability Derivation:** `useAvailability.ts` extracts the list of supported vehicle types, pricing policies, and calculates the available "headroom" (empty slots minus reserved quotas) for each vehicle type to determine if a driver can make a booking.

## 3. Booking / Reservations
**Hooks:** `useReservations.ts`
**Endpoints:** `POST /driver/reservations`, `PATCH /driver/reservations/{id}/cancel`

*   **Create Reservation:** Drivers can book a spot by providing `vehicleTypeId`, `licensePlate`, `expectedEntryTime`, and `expectedExitTime`.
*   **Quota Handling:** If the parking lot is fully booked for the selected time, the backend throws a `409 Conflict` (specifically tagged as `QUOTA_FULL`). The frontend intercepts this to show a locked-state UI on the booking form rather than a generic error toast.
*   **Cancel Reservation:** Drivers can cancel their upcoming reservations via the PATCH endpoint.

## 4. My Bookings (History & Management)
**Hooks:** `useMyReservations.ts`
**Endpoints:** `GET /driver/reservations/my`

*   **Personal List:** Instead of the manager's `useReservations` (which pulls all system reservations), the driver app uses `useMyReservations` to fetch only the reservations belonging to the authenticated driver.
*   **Polling (Optional):** The hook supports background refetching to keep the driver's booking status (e.g., waiting for deposit, active, completed) up-to-date in real time.

## 5. Payments (PayOS Integration)
**Hooks:** `usePayDeposit.ts`, `usePayosLink.ts`
**Endpoints:** Backend payment flow specific to reservations.

*   **Deposit Requirement:** Upon successfully creating a reservation, the driver must pay a deposit to secure it.
*   **Payment Linking:** `usePayosLink.ts` handles redirecting the user to the PayOS checkout page.
*   **Payment Verification:** Once returned to the `/payment` success/cancel routes, `usePayDeposit.ts` is used to verify the payment status and update the reservation status to "CONFIRMED".

## 6. Feedback (Session Ratings)
**Hooks:** `useFeedback.ts`
**Endpoints:** `GET /driver/sessions/history`, `POST /driver/feedbacks`

*   **Self-Service Ratings:** Drivers rate their own **Completed** parking sessions from `/driver/feedback`. The list is derived from session history filtered to `Completed`; submitting sends a 1–5 rating + optional comment. The BE rejects a rating if the session isn't the driver's own, isn't Completed, or was already rated.

## Note on Missing Features (Handled by Staff App)
*   **Session Management (`useSessions.ts`):** The physical check-in and check-out process is handled entirely by Staff or Gate Cameras. The Driver app only manages the reservation phase.
