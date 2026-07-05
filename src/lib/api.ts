// Single API seam. Components/hooks call apiFetch — switching from MSW mocks to the
// real Spring Boot backend is just setting NEXT_PUBLIC_API_BASE (no component changes).
import { normalizeSpringBootError, type AppError } from './errors'
import { getToken, notifyUnauthorized } from './authToken'

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api'

// Origin of the trusted backend, derived once from API_BASE. Used to make sure the JWT
// is only ever sent there — never leaked to some other absolute URL passed to apiFetch.
const API_ORIGIN: string | null = (() => {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    return new URL(API_BASE, base).origin
  } catch {
    return null
  }
})()

/**
 * Whether the JWT may be attached to this request. Relative paths hit our own
 * origin/proxy (trusted); absolute URLs must match the configured backend origin.
 * This prevents the Authorization header from leaking to any third-party host.
 */
function isTrustedApiUrl(url: string): boolean {
  if (!url.startsWith('http')) return true
  try {
    return new URL(url).origin === API_ORIGIN
  } catch {
    return false
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

interface Envelope {
  success: boolean
  message?: string
  data?: unknown
  errorCode?: string
}

/** BE wraps every response as { success, message, data }. */
function isEnvelope(p: unknown): p is Envelope {
  return (
    typeof p === 'object' &&
    p !== null &&
    'success' in p &&
    typeof (p as { success: unknown }).success === 'boolean'
  )
}

/**
 * Typed fetch wrapper.
 * - Prefixes API_BASE, JSON-encodes the body, sets JSON headers, attaches the JWT.
 * - Unwraps the `{success,message,data}` envelope → returns `data`; throws a
 *   normalized {@link AppError} when `success:false` or the response is not ok.
 * - Mocks that still return un-enveloped JSON are passed through unchanged.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  // Only attach the JWT to the trusted backend — never to an arbitrary absolute URL.
  const token = isTrustedApiUrl(url) ? getToken() : null

  let res: Response
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (networkError) {
    throw normalizeSpringBootError(networkError)
  }

  // A 401 means the JWT was rejected (expired/invalid). Drop it and reset auth state so
  // protected pages route back to login instead of looping on failed requests.
  if (res.status === 401 && token) notifyUnauthorized()

  const payload = await res.json().catch(() => null)

  if (isEnvelope(payload)) {
    if (!res.ok || !payload.success) {
      throw normalizeSpringBootError({
        success: false,
        message: payload.message ?? 'Đã xảy ra lỗi',
        errorCode: payload.errorCode ?? 'UNKNOWN_ERROR',
      })
    }
    return ('data' in payload ? payload.data : payload) as T
  }

  if (!res.ok) {
    throw normalizeSpringBootError(payload ?? res)
  }
  return payload as T
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  del: <T>(path: string, options?: ApiOptions) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
}

export type { AppError }
