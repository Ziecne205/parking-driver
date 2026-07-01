// Single source of truth for mock accounts (driver-only app).
// Used by BOTH /api/auth/login and /api/users/:id so a logged-in user's id always
// resolves to the same profile. Password is the same for every demo account.

export interface MockAccount {
  id: string
  email: string
  password: string
  phone: string
  fullName: string
}

export const DEMO_PASSWORD = '123456'

export const MOCK_USERS: MockAccount[] = [
  { id: 'u-driver', email: 'driver@parking.vn', password: DEMO_PASSWORD, phone: '0901234567', fullName: 'Lê Văn Tài' },
]

export function findAccountByEmail(email: string): MockAccount | undefined {
  const e = email.trim().toLowerCase()
  return MOCK_USERS.find((u) => u.email.toLowerCase() === e)
}

/** Fallback when an unknown email is used — always returns the driver account. */
export function accountForUnknownEmail(_email: string): MockAccount {
  return MOCK_USERS[0]
}
