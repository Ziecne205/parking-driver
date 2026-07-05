// Single holder for the JWT so the API seam (`lib/api.ts`) can attach it without
// importing the auth store (avoids a circular dependency). Mirrored to localStorage
// so the token survives a page reload.
const KEY = 'parking_driver_token'
let inMemory: string | null = null

export function getToken(): string | null {
  if (inMemory !== null) return inMemory
  if (typeof window !== 'undefined') {
    inMemory = window.localStorage.getItem(KEY)
  }
  return inMemory
}

export function setToken(token: string | null): void {
  inMemory = token
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(KEY, token)
  else window.localStorage.removeItem(KEY)
}

// The auth store registers a handler here so a rejected JWT (401, detected in lib/api)
// can trigger a full logout — without lib/api importing the store, which would recreate
// the circular dependency this module exists to avoid.
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

/** Called on a 401. Clears the bad token, then lets the store reset auth state. */
export function notifyUnauthorized(): void {
  setToken(null)
  onUnauthorized?.()
}
