/**
 * Standard error shape for the frontend application
 * All API errors are normalized to this format
 */
export interface AppError {
  /** HTTP status code */
  status: number
  /** Error code for programmatic handling */
  code: string
  /** User-friendly error message in Vietnamese */
  message: string
  /** Additional error details (optional) */
  details?: Record<string, unknown>
  /** Timestamp when error occurred */
  timestamp: string
  /** Request path that caused the error */
  path?: string
}

/**
 * Spring Boot error response format
 * Based on Spring Boot's default error response structure
 */
export interface SpringBootError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  trace?: string
  errors?: Array<{
    field: string
    defaultMessage: string
    code: string
  }>
}

/**
 * Authoritative API error envelope (APIs-List.md §0).
 * Example: { success: false, message: "Khung giờ đã khóa đặt chỗ", errorCode: "QUOTA_FULL" }
 */
export interface ApiEnvelopeError {
  success: false
  message: string
  errorCode: string
}

/**
 * Spring Boot validation error format
 * Used for @Valid annotation failures
 */
export interface SpringBootValidationError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  errors: Array<{
    field: string
    rejectedValue: unknown
    defaultMessage: string
    objectName: string
    code: string
  }>
}

/**
 * Error code mappings for common scenarios
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business Logic
  SLOT_NOT_AVAILABLE: 'SLOT_NOT_AVAILABLE',
  BOOKING_EXPIRED: 'BOOKING_EXPIRED',
  SESSION_ACTIVE: 'SESSION_ACTIVE',
  INVALID_LICENSE_PLATE: 'INVALID_LICENSE_PLATE',
  QUOTA_FULL: 'QUOTA_FULL', // booking window locked (capacity-reservation)
  FULL: 'FULL', // walk-in admission denied — no headroom

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Vietnamese error messages for common error codes
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication & Authorization
  UNAUTHORIZED: 'Vui lòng đăng nhập để tiếp tục',
  FORBIDDEN: 'Bạn không có quyền truy cập tài nguyên này',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',

  // Validation
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  INVALID_INPUT: 'Thông tin nhập vào không đúng định dạng',

  // Resource
  NOT_FOUND: 'Không tìm thấy tài nguyên',
  ALREADY_EXISTS: 'Tài nguyên đã tồn tại',
  CONFLICT: 'Xung đột dữ liệu',

  // Business Logic
  SLOT_NOT_AVAILABLE: 'Vị trí đỗ xe không khả dụng',
  BOOKING_EXPIRED: 'Đặt chỗ đã hết hạn',
  SESSION_ACTIVE: 'Phiên đỗ xe đang hoạt động',
  INVALID_LICENSE_PLATE: 'Biển số xe không hợp lệ',
  QUOTA_FULL: 'Khung giờ đã khóa đặt chỗ',
  FULL: 'Bãi đã đầy cho loại xe này',

  // Server
  INTERNAL_ERROR: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau',
  SERVICE_UNAVAILABLE: 'Dịch vụ tạm thời không khả dụng',
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối',

  // Unknown
  UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định',
}

/**
 * Map HTTP status codes to error codes
 */
function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 401:
      return ErrorCodes.UNAUTHORIZED
    case 403:
      return ErrorCodes.FORBIDDEN
    case 404:
      return ErrorCodes.NOT_FOUND
    case 409:
      return ErrorCodes.CONFLICT
    case 422:
      return ErrorCodes.VALIDATION_ERROR
    case 500:
      return ErrorCodes.INTERNAL_ERROR
    case 503:
      return ErrorCodes.SERVICE_UNAVAILABLE
    default:
      return ErrorCodes.UNKNOWN_ERROR
  }
}

/**
 * Normalize Spring Boot error response to AppError format
 */
export function normalizeSpringBootError(error: unknown): AppError {
  // Handle network errors (fetch failures)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      status: 0,
      code: ErrorCodes.NETWORK_ERROR,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      timestamp: new Date().toISOString(),
    }
  }

  // Handle the authoritative API envelope { success:false, message, errorCode }
  if (isApiEnvelopeError(error)) {
    const code = (error.errorCode in ERROR_MESSAGES
      ? error.errorCode
      : ErrorCodes.UNKNOWN_ERROR) as ErrorCode
    return {
      status: 0,
      code,
      // Prefer the server's message; fall back to our localized copy.
      message: error.message || ERROR_MESSAGES[code],
      timestamp: new Date().toISOString(),
    }
  }

  // Handle Response objects from fetch
  if (error instanceof Response) {
    return {
      status: error.status,
      code: getErrorCodeFromStatus(error.status),
      message: ERROR_MESSAGES[getErrorCodeFromStatus(error.status)],
      timestamp: new Date().toISOString(),
      path: error.url,
    }
  }

  // Handle Spring Boot error response
  if (isSpringBootError(error)) {
    const code = mapSpringBootErrorToCode(error)

    return {
      status: error.status,
      code,
      message: getVietnameseMessage(error, code),
      details: error.errors ? { validationErrors: error.errors } : undefined,
      timestamp: error.timestamp,
      path: error.path,
    }
  }

  // Handle Spring Boot validation error
  if (isSpringBootValidationError(error)) {
    return {
      status: error.status,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Dữ liệu không hợp lệ',
      details: {
        validationErrors: error.errors.map(err => ({
          field: err.field,
          message: err.defaultMessage,
          rejectedValue: err.rejectedValue,
        })),
      },
      timestamp: error.timestamp,
      path: error.path,
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      status: 500,
      code: ErrorCodes.INTERNAL_ERROR,
      message: error.message || ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
    }
  }

  // Fallback for unknown error types
  return {
    status: 500,
    code: ErrorCodes.UNKNOWN_ERROR,
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Type guard for the authoritative API error envelope
 */
function isApiEnvelopeError(error: unknown): error is ApiEnvelopeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as { success: unknown }).success === false &&
    'errorCode' in error &&
    'message' in error
  )
}

/**
 * Type guard for Spring Boot error
 */
function isSpringBootError(error: unknown): error is SpringBootError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'error' in error &&
    'message' in error &&
    'timestamp' in error
  )
}

/**
 * Type guard for Spring Boot validation error
 */
function isSpringBootValidationError(error: unknown): error is SpringBootValidationError {
  return (
    isSpringBootError(error) &&
    'errors' in error &&
    Array.isArray((error as SpringBootValidationError).errors) &&
    (error as SpringBootValidationError).errors.length > 0 &&
    'field' in (error as SpringBootValidationError).errors[0]
  )
}

/**
 * Map Spring Boot error message to error code
 */
function mapSpringBootErrorToCode(error: SpringBootError): ErrorCode {
  const message = error.message.toLowerCase()
  const errorType = error.error.toLowerCase()

  // Check for specific business logic errors
  if (message.includes('slot') && message.includes('not available')) {
    return ErrorCodes.SLOT_NOT_AVAILABLE
  }
  if (message.includes('booking') && message.includes('expired')) {
    return ErrorCodes.BOOKING_EXPIRED
  }
  if (message.includes('session') && message.includes('active')) {
    return ErrorCodes.SESSION_ACTIVE
  }
  if (message.includes('license plate') || message.includes('biển số')) {
    return ErrorCodes.INVALID_LICENSE_PLATE
  }
  if (message.includes('already exists')) {
    return ErrorCodes.ALREADY_EXISTS
  }
  if (message.includes('not found')) {
    return ErrorCodes.NOT_FOUND
  }
  if (message.includes('unauthorized') || errorType.includes('unauthorized')) {
    return ErrorCodes.UNAUTHORIZED
  }
  if (message.includes('forbidden') || errorType.includes('forbidden')) {
    return ErrorCodes.FORBIDDEN
  }
  if (message.includes('token expired') || message.includes('jwt expired')) {
    return ErrorCodes.TOKEN_EXPIRED
  }
  if (message.includes('invalid credentials') || message.includes('bad credentials')) {
    return ErrorCodes.INVALID_CREDENTIALS
  }

  // Fallback to status-based mapping
  return getErrorCodeFromStatus(error.status)
}

/**
 * Get Vietnamese error message
 * Prefers predefined messages, falls back to Spring Boot message
 */
function getVietnameseMessage(error: SpringBootError, code: ErrorCode): string {
  // Use predefined Vietnamese message if available
  if (code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[code]
  }

  // Fallback to Spring Boot message (might be in English)
  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Helper function to handle API errors in try-catch blocks
 *
 * @example
 * try {
 *   const response = await fetch('/api/slots')
 *   if (!response.ok) {
 *     throw await handleApiError(response)
 *   }
 * } catch (error) {
 *   const appError = normalizeSpringBootError(error)
 *   toast.error(appError.message)
 * }
 */
export async function handleApiError(response: Response): Promise<AppError> {
  try {
    const errorData = await response.json()
    return normalizeSpringBootError(errorData)
  } catch {
    // If response body is not JSON, create error from response
    return normalizeSpringBootError(response)
  }
}
